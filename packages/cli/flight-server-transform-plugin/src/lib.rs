use serde::{Deserialize, Serialize};
use serde_json::json;
use std::path::PathBuf;
use swc_core::ecma::ast::{AssignTarget, Prop, PropName, PropOrSpread, SimpleAssignTarget};
use swc_core::ecma::transforms::testing::FixtureTestConfig;
use swc_core::plugin::{plugin_transform, proxies::TransformPluginProgramMetadata};
use swc_core::{
    common::{
        comments::{Comment, CommentKind, Comments},
        DUMMY_SP,
    },
    ecma::{
        ast::{
            ArrowExpr, BindingIdent, BlockStmt, BlockStmtOrExpr, CallExpr, Callee, ClassDecl, Decl,
            DefaultDecl, ExportDecl, ExportDefaultDecl, ExportDefaultExpr, ExportSpecifier, Expr,
            ExprOrSpread, ExprStmt, FnDecl, Function, Ident, IdentName, ImportDecl,
            ImportNamedSpecifier, ImportPhase, ImportSpecifier, Lit, MemberExpr, MemberProp,
            Module, ModuleDecl, ModuleExportName, ModuleItem, NamedExport, Pat, Program, Stmt, Str,
            VarDecl, VarDeclKind, VarDeclarator,
        },
        parser::{Syntax, TsSyntax},
        transforms::testing::{test, test_fixture},
        visit::{visit_mut_pass, VisitMut, VisitMutWith},
    },
    plugin::metadata::TransformPluginMetadataContextKind,
    quote,
    testing::fixture,
};

#[derive(Debug, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct TransformConfig {
    app_dir: String,
    runtime_path: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct Reference {
    #[serde(skip_serializing_if = "Option::is_none")]
    id: Option<String>,
    export_name: String,
    #[serde(skip)]
    local_name: String,
}

#[derive(Debug)]
struct ExportInfo {
    local_name: String,
    export_name: String,
}

#[derive(Debug, PartialEq, Serialize)]
#[serde(rename_all = "lowercase")]
enum Directive {
    Client,
    Server,
}

#[derive(PartialEq)]
enum ReferenceType {
    Client,
    Server,
}

pub struct TransformVisitor<C>
where
    C: Comments,
{
    directive: Option<Directive>,
    references: Vec<Reference>,
    filename: String,
    comments: Option<C>,
    export_mappings: Vec<ExportInfo>,
    runtime_path: String,
    action_count: u8,
}

#[derive(Debug)]
struct ServerReferenceInfo {
    position: usize,
    ident: Ident,
    local_name: String,
}

#[derive(Debug)]
struct VarDeclInsertInfo {
    position: usize,
    ident: Ident,
    expr: Box<Expr>,
}

impl<C> TransformVisitor<C>
where
    C: Comments,
{
    fn new(filename: String, comments: Option<C>, app_dir: String, runtime_path: String) -> Self {
        let app_dir = app_dir.replace('\\', "/");
        let filename = filename.replace('\\', "/");

        let app_dir = app_dir.trim_end_matches('/');

        let relative_path = if filename.starts_with(&app_dir) {
            filename[app_dir.len()..].trim_start_matches('/')
        } else {
            &filename
        }
        .to_string();

        Self {
            directive: None,
            references: vec![],
            filename: relative_path,
            comments,
            export_mappings: vec![],
            runtime_path,
            action_count: 0,
        }
    }

    fn create_import_decl(&self) -> ModuleItem {
        ModuleItem::ModuleDecl(ModuleDecl::Import(ImportDecl {
            span: DUMMY_SP,
            specifiers: vec![ImportSpecifier::Named(ImportNamedSpecifier {
                span: DUMMY_SP,
                local: Ident::new(
                    "registerClientReference".into(),
                    DUMMY_SP,
                    Default::default(),
                ),
                imported: None,
                is_type_only: false,
            })],
            src: Box::new(Str::from(self.runtime_path.as_str())),
            type_only: false,
            with: None,
            phase: ImportPhase::Evaluation,
        }))
    }

    fn create_proxy_function(&self) -> ModuleItem {
        quote!(
            "function createClientReferenceProxy($export_name) {
                const filename = $file_path;
                return () => {
                    throw new Error(`Attempted to call ${$export_name}() from the server of ${filename} but ${$export_name} is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.`);
                }
            }" as ModuleItem,
            file_path: Expr = Str::from(self.filename.as_str()).into(),
            export_name = Ident::new("exportName".into(), DUMMY_SP, Default::default())
        )
    }

    fn create_client_reference(&self, export_name: &str) -> Expr {
        Expr::Call(CallExpr {
            span: DUMMY_SP,
            callee: Callee::Expr(Box::new(Expr::Ident(Ident::new(
                "registerClientReference".into(),
                DUMMY_SP,
                Default::default(),
            )))),
            args: vec![
                ExprOrSpread {
                    spread: None,
                    expr: Box::new(Expr::Call(CallExpr {
                        span: DUMMY_SP,
                        callee: Callee::Expr(Box::new(Expr::Ident(Ident::new(
                            "createClientReferenceProxy".into(),
                            DUMMY_SP,
                            Default::default(),
                        )))),
                        args: vec![ExprOrSpread {
                            spread: None,
                            expr: Box::new(Expr::Lit(Lit::Str(Str::from(export_name)))),
                        }],
                        type_args: None,
                        ctxt: Default::default(),
                    })),
                },
                ExprOrSpread {
                    spread: None,
                    expr: Box::new(Expr::Lit(Lit::Str(Str::from(format!(
                        "{}#{}",
                        self.filename, export_name
                    ))))),
                },
                ExprOrSpread {
                    spread: None,
                    expr: Box::new(Expr::Lit(Lit::Str(Str::from(export_name)))),
                },
            ],
            type_args: None,
            ctxt: Default::default(),
        })
    }

    fn create_server_import_decl(&self) -> ModuleItem {
        ModuleItem::ModuleDecl(ModuleDecl::Import(ImportDecl {
            span: DUMMY_SP,
            specifiers: vec![ImportSpecifier::Named(ImportNamedSpecifier {
                span: DUMMY_SP,
                local: Ident::new(
                    "registerServerReference".into(),
                    DUMMY_SP,
                    Default::default(),
                ),
                imported: None,
                is_type_only: false,
            })],
            src: Box::new(Str::from(self.runtime_path.as_str())),
            type_only: false,
            with: None,
            phase: ImportPhase::Evaluation,
        }))
    }

    fn create_server_reference(&self, ident: &Ident, local_name: &str) -> Stmt {
        let export_name = self.get_export_name(local_name);

        Stmt::Expr(ExprStmt {
            span: DUMMY_SP,
            expr: Box::new(Expr::Call(CallExpr {
                span: DUMMY_SP,
                callee: Callee::Expr(Box::new(Expr::Ident(Ident::new(
                    "registerServerReference".into(),
                    DUMMY_SP,
                    Default::default(),
                )))),
                args: vec![
                    ExprOrSpread {
                        spread: None,
                        expr: Box::new(Expr::Ident(ident.clone())),
                    },
                    ExprOrSpread {
                        spread: None,
                        expr: Box::new(Expr::Member(MemberExpr {
                            span: DUMMY_SP,
                            obj: Box::new(Expr::Ident(Ident::new(
                                "module".into(),
                                DUMMY_SP,
                                Default::default(),
                            ))),
                            prop: MemberProp::Ident(IdentName::new("id".into(), DUMMY_SP)),
                        })),
                    },
                    ExprOrSpread {
                        spread: None,
                        expr: Box::new(Expr::Lit(Lit::Str(Str::from(export_name)))),
                    },
                ],
                type_args: None,
                ctxt: Default::default(),
            })),
        })
    }

    fn is_use_server_directive(&self, block: &BlockStmt) -> bool {
        if let Some(first_stmt) = block.stmts.first() {
            if let Stmt::Expr(expr_stmt) = first_stmt {
                if let Expr::Lit(lit) = &*expr_stmt.expr {
                    if let Lit::Str(str_lit) = lit {
                        if let Some("use server") = str_lit.value.as_str() {
                            return true;
                        }
                    }
                }
            }
        }
        false
    }

    fn has_server_directive_in_function(&self, function: &Function) -> bool {
        if let Some(body) = &function.body {
            return self.is_use_server_directive(body);
        }
        false
    }

    fn has_server_directive_in_arrow(&self, expr: &ArrowExpr) -> bool {
        if let BlockStmtOrExpr::BlockStmt(block) = &*expr.body {
            return self.is_use_server_directive(block);
        }
        false
    }

    fn add_reference(&mut self, local_name: String, reference_type: ReferenceType) {
        let mapped_name = self.get_export_name(&local_name);
        let id = if reference_type == ReferenceType::Client {
            Some(format!("{}#{}", self.filename.to_string(), mapped_name))
        } else {
            None
        };

        self.references.push(Reference {
            id,
            local_name,
            export_name: mapped_name,
        });
    }

    fn update_reference(&mut self, old_name: &str, new_name: &str) {
        if let Some(idx) = self
            .references
            .iter()
            .position(|r| r.export_name == old_name)
        {
            self.references[idx].export_name = new_name.to_string();
        }
    }

    fn has_reference(&self, local_name: &str) -> bool {
        let result = self.references.iter().any(|r| r.local_name == local_name);
        result
    }

    fn get_export_name(&self, local_name: &str) -> String {
        self.export_mappings
            .iter()
            .find(|info| info.local_name == local_name)
            .map(|info| info.export_name.clone())
            .unwrap_or_else(|| local_name.to_string())
    }
}

impl<C> VisitMut for TransformVisitor<C>
where
    C: Comments,
{
    fn visit_mut_module(&mut self, module: &mut Module) {
        let mut server_directive_pos = None;

        for (index, directive) in module.body.iter().enumerate() {
            if let ModuleItem::Stmt(Stmt::Expr(ExprStmt { expr, .. })) = directive {
                if let Expr::Lit(lit) = expr.as_ref() {
                    if let Lit::Str(str) = lit {
                        match str.value.as_str() {
                            Some("use client") => {
                                self.directive = Some(Directive::Client);
                            }
                            Some("use server") => {
                                self.directive = Some(Directive::Server);
                                server_directive_pos = Some(index);
                            }
                            _ => {}
                        }
                    }
                }
            }
        }

        if self.directive == Some(Directive::Client) {
            let mut new_body = vec![];
            new_body.push(ModuleItem::Stmt(Stmt::Expr(ExprStmt {
                span: DUMMY_SP,
                expr: Box::new(Expr::Lit(Lit::Str(Str::from("use client")))),
            })));
            new_body.push(self.create_import_decl());
            new_body.push(self.create_proxy_function());

            for item in &module.body {
                match item {
                    ModuleItem::ModuleDecl(ModuleDecl::ExportDecl(ExportDecl { decl, .. })) => {
                        match decl {
                            Decl::Class(ClassDecl { ident, .. })
                            | Decl::Fn(FnDecl { ident, .. }) => {
                                self.add_reference(ident.sym.to_string(), ReferenceType::Client);
                                new_body.push(ModuleItem::ModuleDecl(ModuleDecl::ExportDecl(
                                    ExportDecl {
                                        span: DUMMY_SP,
                                        decl: Decl::Var(Box::new(VarDecl {
                                            span: DUMMY_SP,
                                            kind: VarDeclKind::Const,
                                            declare: false,
                                            decls: vec![VarDeclarator {
                                                span: DUMMY_SP,
                                                name: Pat::Ident(BindingIdent {
                                                    id: ident.clone(),
                                                    type_ann: None,
                                                }),
                                                init: Some(Box::new(self.create_client_reference(
                                                    &ident.sym.to_string(),
                                                ))),
                                                definite: false,
                                            }],
                                            ctxt: Default::default(),
                                        })),
                                    },
                                )));
                            }
                            Decl::Var(var_decl) => {
                                for decl in &var_decl.decls {
                                    if let Pat::Ident(ident) = &decl.name {
                                        self.add_reference(
                                            ident.id.sym.to_string(),
                                            ReferenceType::Client,
                                        );
                                        new_body.push(ModuleItem::ModuleDecl(
                                            ModuleDecl::ExportDecl(ExportDecl {
                                                span: DUMMY_SP,
                                                decl: Decl::Var(Box::new(VarDecl {
                                                    span: DUMMY_SP,
                                                    kind: VarDeclKind::Const,
                                                    declare: false,
                                                    decls: vec![VarDeclarator {
                                                        span: DUMMY_SP,
                                                        name: Pat::Ident(ident.clone()),
                                                        init: Some(Box::new(
                                                            self.create_client_reference(
                                                                &ident.id.sym.to_string(),
                                                            ),
                                                        )),
                                                        definite: false,
                                                    }],
                                                    ctxt: Default::default(),
                                                })),
                                            }),
                                        ));
                                    }
                                }
                            }
                            _ => {}
                        }
                    }
                    ModuleItem::ModuleDecl(ModuleDecl::ExportNamed(NamedExport {
                        specifiers,
                        ..
                    })) => {
                        for spec in specifiers {
                            if let ExportSpecifier::Named(named) = spec {
                                if let ModuleExportName::Ident(id) =
                                    named.exported.as_ref().unwrap_or(&named.orig)
                                {
                                    self.add_reference(id.sym.to_string(), ReferenceType::Client);
                                    new_body.push(ModuleItem::ModuleDecl(ModuleDecl::ExportDecl(
                                        ExportDecl {
                                            span: DUMMY_SP,
                                            decl: Decl::Var(Box::new(VarDecl {
                                                span: DUMMY_SP,
                                                kind: VarDeclKind::Const,
                                                declare: false,
                                                decls: vec![VarDeclarator {
                                                    span: DUMMY_SP,
                                                    name: Pat::Ident(BindingIdent {
                                                        id: id.clone(),
                                                        type_ann: None,
                                                    }),
                                                    init: Some(Box::new(
                                                        self.create_client_reference(
                                                            &id.sym.to_string(),
                                                        ),
                                                    )),
                                                    definite: false,
                                                }],
                                                ctxt: Default::default(),
                                            })),
                                        },
                                    )));
                                }
                            }
                        }
                    }
                    ModuleItem::ModuleDecl(ModuleDecl::ExportDefaultDecl(_))
                    | ModuleItem::ModuleDecl(ModuleDecl::ExportDefaultExpr(_)) => {
                        self.add_reference("default".to_string(), ReferenceType::Client);
                        let default_export = ModuleItem::ModuleDecl(ModuleDecl::ExportDefaultExpr(
                            ExportDefaultExpr {
                                span: DUMMY_SP,
                                expr: Box::new(self.create_client_reference("default")),
                            },
                        ));
                        new_body.push(default_export);
                    }
                    ModuleItem::Stmt(Stmt::Expr(ExprStmt { expr, .. })) => {
                        if let Expr::Assign(assign_expr) = expr.as_ref() {
                            if let AssignTarget::Simple(SimpleAssignTarget::Member(member)) =
                                &assign_expr.left
                            {
                                if let Expr::Ident(obj_ident) = member.obj.as_ref() {
                                    // handle module.exports = xxx
                                    if obj_ident.sym.to_string() == "module" {
                                        if let MemberProp::Ident(prop_ident) = &member.prop {
                                            if prop_ident.sym.to_string() == "exports" {
                                                match assign_expr.right.as_ref() {
                                                    // handle module.exports = { xxx: xxx }
                                                    Expr::Object(obj_expr) => {
                                                        for prop in &obj_expr.props {
                                                            if let PropOrSpread::Prop(prop) = prop {
                                                                if let Prop::KeyValue(kv) =
                                                                    prop.as_ref()
                                                                {
                                                                    if let PropName::Ident(
                                                                        key_ident,
                                                                    ) = &kv.key
                                                                    {
                                                                        let export_name = key_ident
                                                                            .sym
                                                                            .to_string();
                                                                        self.add_reference(
                                                                            export_name.clone(),
                                                                            ReferenceType::Client,
                                                                        );

                                                                        let client_ref_expr = Box::new(self.create_client_reference(&export_name));
                                                                        new_body.push(ModuleItem::ModuleDecl(ModuleDecl::ExportDecl(
                                                                            ExportDecl {
                                                                                span: DUMMY_SP,
                                                                                decl: Decl::Var(Box::new(VarDecl {
                                                                                    span: DUMMY_SP,
                                                                                    kind: VarDeclKind::Const,
                                                                                    declare: false,
                                                                                    decls: vec![VarDeclarator {
                                                                                        span: DUMMY_SP,
                                                                                        name: Pat::Ident(BindingIdent {
                                                                                            id: Ident::new(export_name.clone().into(), DUMMY_SP, Default::default()),
                                                                                            type_ann: None,
                                                                                        }),
                                                                                        init: Some(client_ref_expr),
                                                                                        definite: false,
                                                                                    }],
                                                                                    ctxt: Default::default(),
                                                                                })),
                                                                            },
                                                                        )));
                                                                    }
                                                                } else if let Prop::Shorthand(
                                                                    shorthand,
                                                                ) = prop.as_ref()
                                                                {
                                                                    let export_name =
                                                                        shorthand.sym.to_string();
                                                                    self.add_reference(
                                                                        export_name.clone(),
                                                                        ReferenceType::Client,
                                                                    );

                                                                    let client_ref_expr = Box::new(self.create_client_reference(&export_name));
                                                                    new_body.push(ModuleItem::ModuleDecl(ModuleDecl::ExportDecl(
                                                                        ExportDecl {
                                                                            span: DUMMY_SP,
                                                                            decl: Decl::Var(Box::new(VarDecl {
                                                                                span: DUMMY_SP,
                                                                                kind: VarDeclKind::Const,
                                                                                declare: false,
                                                                                decls: vec![VarDeclarator {
                                                                                    span: DUMMY_SP,
                                                                                    name: Pat::Ident(BindingIdent {
                                                                                        id: Ident::new(export_name.clone().into(), DUMMY_SP, Default::default()),
                                                                                        type_ann: None,
                                                                                    }),
                                                                                    init: Some(client_ref_expr),
                                                                                    definite: false,
                                                                                }],
                                                                                ctxt: Default::default(),
                                                                            })),
                                                                        },
                                                                    )));
                                                                }
                                                            }
                                                        }
                                                    }
                                                    // 处理 module.exports = 单一值导出，视为 default 导出
                                                    _ => {
                                                        self.add_reference(
                                                            "default".to_string(),
                                                            ReferenceType::Client,
                                                        );

                                                        let client_ref_expr = Box::new(
                                                            self.create_client_reference("default"),
                                                        );
                                                        new_body.push(ModuleItem::ModuleDecl(
                                                            ModuleDecl::ExportDefaultExpr(
                                                                ExportDefaultExpr {
                                                                    span: DUMMY_SP,
                                                                    expr: client_ref_expr,
                                                                },
                                                            ),
                                                        ));
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    // handle exports.xxx = yyy
                                    else if obj_ident.sym.to_string() == "exports" {
                                        if let MemberProp::Ident(prop_ident) = &member.prop {
                                            let export_name = prop_ident.sym.to_string();
                                            self.add_reference(
                                                export_name.clone(),
                                                ReferenceType::Client,
                                            );

                                            let client_ref_expr = Box::new(
                                                self.create_client_reference(&export_name),
                                            );
                                            new_body.push(ModuleItem::ModuleDecl(
                                                ModuleDecl::ExportDecl(ExportDecl {
                                                    span: DUMMY_SP,
                                                    decl: Decl::Var(Box::new(VarDecl {
                                                        span: DUMMY_SP,
                                                        kind: VarDeclKind::Const,
                                                        declare: false,
                                                        decls: vec![VarDeclarator {
                                                            span: DUMMY_SP,
                                                            name: Pat::Ident(BindingIdent {
                                                                id: Ident::new(
                                                                    export_name.clone().into(),
                                                                    DUMMY_SP,
                                                                    Default::default(),
                                                                ),
                                                                type_ann: None,
                                                            }),
                                                            init: Some(client_ref_expr),
                                                            definite: false,
                                                        }],
                                                        ctxt: Default::default(),
                                                    })),
                                                }),
                                            ));
                                        }
                                    }
                                }
                            }
                        }
                    }
                    _ => {}
                }
            }
            module.body = new_body;
        } else {
            for item in module.body.iter() {
                match item {
                    ModuleItem::ModuleDecl(ModuleDecl::ExportNamed(named_export)) => {
                        for spec in &named_export.specifiers {
                            if let ExportSpecifier::Named(named_spec) = spec {
                                if let ModuleExportName::Ident(exported) = &named_spec
                                    .exported
                                    .clone()
                                    .unwrap_or_else(|| match &named_spec.orig {
                                        ModuleExportName::Ident(i) => {
                                            ModuleExportName::Ident(i.clone())
                                        }
                                        _ => ModuleExportName::Ident(Ident::new(
                                            "".into(),
                                            DUMMY_SP,
                                            Default::default(),
                                        )),
                                    })
                                {
                                    if let ModuleExportName::Ident(local) = &named_spec.orig {
                                        self.export_mappings.push(ExportInfo {
                                            local_name: local.sym.to_string(),
                                            export_name: exported.sym.to_string(),
                                        });
                                    }
                                }
                            }
                        }
                    }
                    _ => {}
                }
            }

            let mut i = 0;
            let mut actions_to_insert: Vec<ServerReferenceInfo> = vec![];
            let has_server_directive = self.directive == Some(Directive::Server);

            let mut var_decls_to_insert: Vec<VarDeclInsertInfo> = vec![];

            while i < module.body.len() {
                match &mut module.body[i] {
                    ModuleItem::ModuleDecl(ModuleDecl::ExportDecl(ExportDecl { decl, .. })) => {
                        match decl {
                            Decl::Fn(fn_decl) => {
                                if has_server_directive
                                    || self.has_server_directive_in_function(&fn_decl.function)
                                        && !self.has_reference(&fn_decl.ident.sym.to_string())
                                {
                                    let local_name = fn_decl.ident.sym.to_string();
                                    self.add_reference(local_name.clone(), ReferenceType::Server);
                                    actions_to_insert.push(ServerReferenceInfo {
                                        position: i + 1,
                                        ident: fn_decl.ident.clone(),
                                        local_name,
                                    });
                                }
                            }
                            Decl::Var(var_decl) => {
                                for decl in &var_decl.decls {
                                    if let Pat::Ident(ident) = &decl.name {
                                        if let Some(init) = &decl.init {
                                            match init.as_ref() {
                                                Expr::Arrow(arrow) => {
                                                    if has_server_directive
                                                        || self.has_server_directive_in_arrow(arrow)
                                                            && !self.has_reference(
                                                                &ident.id.sym.to_string(),
                                                            )
                                                    {
                                                        let local_name = ident.id.sym.to_string();
                                                        self.add_reference(
                                                            local_name.clone(),
                                                            ReferenceType::Server,
                                                        );
                                                        actions_to_insert.push(
                                                            ServerReferenceInfo {
                                                                position: i + 1,
                                                                ident: ident.id.clone(),
                                                                local_name,
                                                            },
                                                        );
                                                    }
                                                }
                                                _ => {}
                                            }
                                        }
                                    }
                                }
                            }
                            _ => {}
                        }
                    }
                    ModuleItem::ModuleDecl(ModuleDecl::ExportNamed(named_export)) => {
                        for spec in &named_export.specifiers {
                            if let ExportSpecifier::Named(named_spec) = spec {
                                let local_ident = match &named_spec.orig {
                                    ModuleExportName::Ident(i) => i,
                                    _ => continue,
                                };
                                let export_name = match &named_spec.exported {
                                    Some(ModuleExportName::Ident(i)) => i.sym.to_string(),
                                    None => local_ident.sym.to_string(),
                                    _ => continue,
                                };

                                if self.has_reference(&local_ident.sym.to_string()) {
                                    self.update_reference(
                                        &local_ident.sym.to_string(),
                                        &export_name,
                                    );
                                }
                            }
                        }
                    }
                    ModuleItem::ModuleDecl(ModuleDecl::ExportDefaultDecl(ExportDefaultDecl {
                        ref mut decl,
                        ..
                    })) => match decl {
                        DefaultDecl::Fn(ref mut fn_expr) => {
                            if has_server_directive
                                || self.has_server_directive_in_function(&fn_expr.function)
                            {
                                self.add_reference("default".to_string(), ReferenceType::Server);

                                let ident = if let Some(ref mut ident) = fn_expr.ident {
                                    ident.clone()
                                } else {
                                    let new_ident = format!("$$ACTION_{}", self.action_count);
                                    self.action_count += 1;
                                    let new_ident_ident =
                                        Ident::new(new_ident.into(), DUMMY_SP, Default::default());
                                    fn_expr.ident = Some(new_ident_ident.clone());
                                    new_ident_ident
                                };

                                actions_to_insert.push(ServerReferenceInfo {
                                    position: i + 1,
                                    ident,
                                    local_name: "default".to_string(),
                                });
                            }
                        }
                        _ => {}
                    },
                    ModuleItem::ModuleDecl(ModuleDecl::ExportDefaultExpr(ExportDefaultExpr {
                        expr,
                        ..
                    })) => match expr.as_ref() {
                        Expr::Arrow(arrow) => {
                            if has_server_directive || self.has_server_directive_in_arrow(arrow) {
                                self.add_reference("default".to_string(), ReferenceType::Server);

                                let new_ident = format!("$$ACTION_{}", self.action_count);
                                self.action_count += 1;
                                let ident =
                                    Ident::new(new_ident.into(), DUMMY_SP, Default::default());

                                let var_decl_info = VarDeclInsertInfo {
                                    position: i,
                                    ident: ident.clone(),
                                    expr: expr.clone(),
                                };
                                var_decls_to_insert.push(var_decl_info);

                                *expr = Box::new(Expr::Ident(ident.clone()));

                                actions_to_insert.push(ServerReferenceInfo {
                                    position: i,
                                    ident,
                                    local_name: "default".to_string(),
                                });
                            }
                        }
                        Expr::Fn(fn_expr) => {
                            if has_server_directive
                                || self.has_server_directive_in_function(&fn_expr.function)
                            {
                                self.add_reference("default".to_string(), ReferenceType::Server);
                                actions_to_insert.push(ServerReferenceInfo {
                                    position: i + 1,
                                    ident: Ident::new(
                                        "default".into(),
                                        DUMMY_SP,
                                        Default::default(),
                                    ),
                                    local_name: "default".to_string(),
                                });
                            }
                        }
                        Expr::Ident(ident) => {
                            if self.has_reference(&ident.sym.to_string()) {
                                if let Some(action) = actions_to_insert
                                    .iter_mut()
                                    .find(|info| info.local_name == ident.sym.to_string())
                                {
                                    action.local_name = "default".to_string();
                                }
                                self.update_reference(&ident.sym.to_string(), "default");
                            }
                        }
                        _ => {}
                    },
                    ModuleItem::Stmt(Stmt::Decl(Decl::Fn(fn_decl))) => {
                        if has_server_directive
                            || self.has_server_directive_in_function(&fn_decl.function)
                                && !self.has_reference(&fn_decl.ident.sym.to_string())
                        {
                            let fn_name = fn_decl.ident.sym.to_string();
                            self.add_reference(fn_name.clone(), ReferenceType::Server);
                            actions_to_insert.push(ServerReferenceInfo {
                                position: i + 1,
                                ident: fn_decl.ident.clone(),
                                local_name: fn_name,
                            });
                        }
                    }
                    ModuleItem::Stmt(Stmt::Decl(Decl::Var(var_decl))) => {
                        for decl in &var_decl.decls {
                            if let Some(init) = &decl.init {
                                if let Pat::Ident(ident) = &decl.name {
                                    match init.as_ref() {
                                        Expr::Arrow(arrow) => {
                                            if has_server_directive
                                                || self.has_server_directive_in_arrow(arrow)
                                                    && !self
                                                        .has_reference(&ident.id.sym.to_string())
                                            {
                                                let fn_name = ident.id.sym.to_string();
                                                self.add_reference(
                                                    fn_name.clone(),
                                                    ReferenceType::Server,
                                                );
                                                actions_to_insert.push(ServerReferenceInfo {
                                                    position: i + 1,
                                                    ident: ident.id.clone(),
                                                    local_name: fn_name,
                                                });
                                            }
                                        }
                                        Expr::Fn(fn_expr) => {
                                            if has_server_directive
                                                || self.has_server_directive_in_function(
                                                    &fn_expr.function,
                                                ) && !self
                                                    .has_reference(&ident.id.sym.to_string())
                                            {
                                                let fn_name = ident.id.sym.to_string();
                                                self.add_reference(
                                                    fn_name.clone(),
                                                    ReferenceType::Server,
                                                );
                                                actions_to_insert.push(ServerReferenceInfo {
                                                    position: i + 1,
                                                    ident: ident.id.clone(),
                                                    local_name: fn_name,
                                                });
                                            }
                                        }
                                        _ => {}
                                    }
                                }
                            }
                        }
                    }
                    _ => {}
                }
                i += 1;
            }

            if self.references.len() > 0 {
                if has_server_directive {
                    module.body.insert(
                        server_directive_pos.unwrap() + 1,
                        self.create_server_import_decl(),
                    );
                } else {
                    module.body.insert(0, self.create_server_import_decl());
                }
                for (offset, info) in actions_to_insert.into_iter().enumerate() {
                    let server_ref = self.create_server_reference(&info.ident, &info.local_name);
                    module
                        .body
                        .insert(info.position + offset + 1, ModuleItem::Stmt(server_ref));
                }
            }

            for (offset, info) in var_decls_to_insert.into_iter().enumerate() {
                let var_decl = ModuleItem::Stmt(Stmt::Decl(Decl::Var(Box::new(VarDecl {
                    span: DUMMY_SP,
                    kind: VarDeclKind::Const,
                    declare: false,
                    decls: vec![VarDeclarator {
                        span: DUMMY_SP,
                        name: Pat::Ident(BindingIdent {
                            id: info.ident,
                            type_ann: None,
                        }),
                        init: Some(info.expr),
                        definite: false,
                    }],
                    ctxt: Default::default(),
                }))));

                module.body.insert(info.position + offset + 1, var_decl);
            }
        }

        if self.references.len() > 0 {
            let metadata = json!({
                "directive": self.directive,
                "exportNames": self.references
            });

            let comment_str = format!(" @modern-js-rsc-metadata\n{}", metadata.to_string());

            let comment = Comment {
                span: Default::default(),
                text: comment_str.into(),
                kind: CommentKind::Block,
            };

            if let Some(comments) = &self.comments {
                comments.add_leading(module.span.lo, comment);
            }
        }

        module.visit_mut_children_with(self);
    }
}

#[plugin_transform]
pub fn process_transform(program: Program, metadata: TransformPluginProgramMetadata) -> Program {
    let filename = metadata
        .get_context(&TransformPluginMetadataContextKind::Filename)
        .unwrap();
    let config = serde_json::from_str::<TransformConfig>(
        &metadata.get_transform_plugin_config().unwrap_or_default(),
    )
    .unwrap_or_default();
    let comments = metadata.comments;

    program.apply(&mut visit_mut_pass(TransformVisitor::new(
        filename,
        comments,
        config.app_dir,
        config.runtime_path,
    )))
}

#[allow(dead_code)]
#[fixture("tests/fixture/**/input.jsx")]
#[fixture("tests/fixture/**/input.tsx")]
fn fixture(input: PathBuf) {
    let output = input.with_file_name("output.js");
    let app_dir = env!("CARGO_MANIFEST_DIR");

    test_fixture(
        Syntax::Typescript(TsSyntax {
            tsx: input.to_string_lossy().ends_with(".tsx"),
            ..Default::default()
        }),
        &|tester| {
            visit_mut_pass(TransformVisitor::new(
                input.to_string_lossy().into(),
                Some(tester.comments.clone()),
                app_dir.to_string(),
                String::from("@modern-js/runtime/rsc/server"),
            ))
        },
        &input,
        &output,
        FixtureTestConfig {
            module: Some(true),
            ..Default::default()
        },
    );
}
