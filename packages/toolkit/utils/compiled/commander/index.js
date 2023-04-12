(()=>{var t={81:t=>{"use strict";t.exports=require("child_process")},361:t=>{"use strict";t.exports=require("events")},147:t=>{"use strict";t.exports=require("fs")},17:t=>{"use strict";t.exports=require("path")},282:t=>{"use strict";t.exports=require("process")},632:(t,e,i)=>{const{Argument:n}=i(535);const{Command:s}=i(302);const{CommanderError:r,InvalidArgumentError:o}=i(796);const{Help:a}=i(519);const{Option:l}=i(437);e=t.exports=new s;e.program=e;e.Argument=n;e.Command=s;e.CommanderError=r;e.Help=a;e.InvalidArgumentError=o;e.InvalidOptionArgumentError=o;e.Option=l},535:(t,e,i)=>{const{InvalidArgumentError:n}=i(796);class Argument{constructor(t,e){this.description=e||"";this.variadic=false;this.parseArg=undefined;this.defaultValue=undefined;this.defaultValueDescription=undefined;this.argChoices=undefined;switch(t[0]){case"<":this.required=true;this._name=t.slice(1,-1);break;case"[":this.required=false;this._name=t.slice(1,-1);break;default:this.required=true;this._name=t;break}if(this._name.length>3&&this._name.slice(-3)==="..."){this.variadic=true;this._name=this._name.slice(0,-3)}}name(){return this._name}_concatValue(t,e){if(e===this.defaultValue||!Array.isArray(e)){return[t]}return e.concat(t)}default(t,e){this.defaultValue=t;this.defaultValueDescription=e;return this}argParser(t){this.parseArg=t;return this}choices(t){this.argChoices=t.slice();this.parseArg=(t,e)=>{if(!this.argChoices.includes(t)){throw new n(`Allowed choices are ${this.argChoices.join(", ")}.`)}if(this.variadic){return this._concatValue(t,e)}return t};return this}argRequired(){this.required=true;return this}argOptional(){this.required=false;return this}}function humanReadableArgName(t){const e=t.name()+(t.variadic===true?"...":"");return t.required?"<"+e+">":"["+e+"]"}e.Argument=Argument;e.humanReadableArgName=humanReadableArgName},302:(t,e,i)=>{const n=i(361).EventEmitter;const s=i(81);const r=i(17);const o=i(147);const a=i(282);const{Argument:l,humanReadableArgName:h}=i(535);const{CommanderError:u}=i(796);const{Help:c}=i(519);const{Option:p,splitOptionFlags:m,DualOptions:d}=i(437);const{suggestSimilar:f}=i(860);class Command extends n{constructor(t){super();this.commands=[];this.options=[];this.parent=null;this._allowUnknownOption=false;this._allowExcessArguments=true;this._args=[];this.args=[];this.rawArgs=[];this.processedArgs=[];this._scriptPath=null;this._name=t||"";this._optionValues={};this._optionValueSources={};this._storeOptionsAsProperties=false;this._actionHandler=null;this._executableHandler=false;this._executableFile=null;this._executableDir=null;this._defaultCommandName=null;this._exitCallback=null;this._aliases=[];this._combineFlagAndOptionalValue=true;this._description="";this._summary="";this._argsDescription=undefined;this._enablePositionalOptions=false;this._passThroughOptions=false;this._lifeCycleHooks={};this._showHelpAfterError=false;this._showSuggestionAfterError=true;this._outputConfiguration={writeOut:t=>a.stdout.write(t),writeErr:t=>a.stderr.write(t),getOutHelpWidth:()=>a.stdout.isTTY?a.stdout.columns:undefined,getErrHelpWidth:()=>a.stderr.isTTY?a.stderr.columns:undefined,outputError:(t,e)=>e(t)};this._hidden=false;this._hasHelpOption=true;this._helpFlags="-h, --help";this._helpDescription="display help for command";this._helpShortFlag="-h";this._helpLongFlag="--help";this._addImplicitHelpCommand=undefined;this._helpCommandName="help";this._helpCommandnameAndArgs="help [command]";this._helpCommandDescription="display help for command";this._helpConfiguration={}}copyInheritedSettings(t){this._outputConfiguration=t._outputConfiguration;this._hasHelpOption=t._hasHelpOption;this._helpFlags=t._helpFlags;this._helpDescription=t._helpDescription;this._helpShortFlag=t._helpShortFlag;this._helpLongFlag=t._helpLongFlag;this._helpCommandName=t._helpCommandName;this._helpCommandnameAndArgs=t._helpCommandnameAndArgs;this._helpCommandDescription=t._helpCommandDescription;this._helpConfiguration=t._helpConfiguration;this._exitCallback=t._exitCallback;this._storeOptionsAsProperties=t._storeOptionsAsProperties;this._combineFlagAndOptionalValue=t._combineFlagAndOptionalValue;this._allowExcessArguments=t._allowExcessArguments;this._enablePositionalOptions=t._enablePositionalOptions;this._showHelpAfterError=t._showHelpAfterError;this._showSuggestionAfterError=t._showSuggestionAfterError;return this}command(t,e,i){let n=e;let s=i;if(typeof n==="object"&&n!==null){s=n;n=null}s=s||{};const[,r,o]=t.match(/([^ ]+) *(.*)/);const a=this.createCommand(r);if(n){a.description(n);a._executableHandler=true}if(s.isDefault)this._defaultCommandName=a._name;a._hidden=!!(s.noHelp||s.hidden);a._executableFile=s.executableFile||null;if(o)a.arguments(o);this.commands.push(a);a.parent=this;a.copyInheritedSettings(this);if(n)return this;return a}createCommand(t){return new Command(t)}createHelp(){return Object.assign(new c,this.configureHelp())}configureHelp(t){if(t===undefined)return this._helpConfiguration;this._helpConfiguration=t;return this}configureOutput(t){if(t===undefined)return this._outputConfiguration;Object.assign(this._outputConfiguration,t);return this}showHelpAfterError(t=true){if(typeof t!=="string")t=!!t;this._showHelpAfterError=t;return this}showSuggestionAfterError(t=true){this._showSuggestionAfterError=!!t;return this}addCommand(t,e){if(!t._name){throw new Error(`Command passed to .addCommand() must have a name\n- specify the name in Command constructor or using .name()`)}e=e||{};if(e.isDefault)this._defaultCommandName=t._name;if(e.noHelp||e.hidden)t._hidden=true;this.commands.push(t);t.parent=this;return this}createArgument(t,e){return new l(t,e)}argument(t,e,i,n){const s=this.createArgument(t,e);if(typeof i==="function"){s.default(n).argParser(i)}else{s.default(i)}this.addArgument(s);return this}arguments(t){t.split(/ +/).forEach((t=>{this.argument(t)}));return this}addArgument(t){const e=this._args.slice(-1)[0];if(e&&e.variadic){throw new Error(`only the last argument can be variadic '${e.name()}'`)}if(t.required&&t.defaultValue!==undefined&&t.parseArg===undefined){throw new Error(`a default value for a required argument is never used: '${t.name()}'`)}this._args.push(t);return this}addHelpCommand(t,e){if(t===false){this._addImplicitHelpCommand=false}else{this._addImplicitHelpCommand=true;if(typeof t==="string"){this._helpCommandName=t.split(" ")[0];this._helpCommandnameAndArgs=t}this._helpCommandDescription=e||this._helpCommandDescription}return this}_hasImplicitHelpCommand(){if(this._addImplicitHelpCommand===undefined){return this.commands.length&&!this._actionHandler&&!this._findCommand("help")}return this._addImplicitHelpCommand}hook(t,e){const i=["preSubcommand","preAction","postAction"];if(!i.includes(t)){throw new Error(`Unexpected value for event passed to hook : '${t}'.\nExpecting one of '${i.join("', '")}'`)}if(this._lifeCycleHooks[t]){this._lifeCycleHooks[t].push(e)}else{this._lifeCycleHooks[t]=[e]}return this}exitOverride(t){if(t){this._exitCallback=t}else{this._exitCallback=t=>{if(t.code!=="commander.executeSubCommandAsync"){throw t}else{}}}return this}_exit(t,e,i){if(this._exitCallback){this._exitCallback(new u(t,e,i))}a.exit(t)}action(t){const listener=e=>{const i=this._args.length;const n=e.slice(0,i);if(this._storeOptionsAsProperties){n[i]=this}else{n[i]=this.opts()}n.push(this);return t.apply(this,n)};this._actionHandler=listener;return this}createOption(t,e){return new p(t,e)}addOption(t){const e=t.name();const i=t.attributeName();if(t.negate){const e=t.long.replace(/^--no-/,"--");if(!this._findOption(e)){this.setOptionValueWithSource(i,t.defaultValue===undefined?true:t.defaultValue,"default")}}else if(t.defaultValue!==undefined){this.setOptionValueWithSource(i,t.defaultValue,"default")}this.options.push(t);const handleOptionValue=(e,n,s)=>{if(e==null&&t.presetArg!==undefined){e=t.presetArg}const r=this.getOptionValue(i);if(e!==null&&t.parseArg){try{e=t.parseArg(e,r)}catch(t){if(t.code==="commander.invalidArgument"){const e=`${n} ${t.message}`;this.error(e,{exitCode:t.exitCode,code:t.code})}throw t}}else if(e!==null&&t.variadic){e=t._concatValue(e,r)}if(e==null){if(t.negate){e=false}else if(t.isBoolean()||t.optional){e=true}else{e=""}}this.setOptionValueWithSource(i,e,s)};this.on("option:"+e,(e=>{const i=`error: option '${t.flags}' argument '${e}' is invalid.`;handleOptionValue(e,i,"cli")}));if(t.envVar){this.on("optionEnv:"+e,(e=>{const i=`error: option '${t.flags}' value '${e}' from env '${t.envVar}' is invalid.`;handleOptionValue(e,i,"env")}))}return this}_optionEx(t,e,i,n,s){if(typeof e==="object"&&e instanceof p){throw new Error("To add an Option object use addOption() instead of option() or requiredOption()")}const r=this.createOption(e,i);r.makeOptionMandatory(!!t.mandatory);if(typeof n==="function"){r.default(s).argParser(n)}else if(n instanceof RegExp){const t=n;n=(e,i)=>{const n=t.exec(e);return n?n[0]:i};r.default(s).argParser(n)}else{r.default(n)}return this.addOption(r)}option(t,e,i,n){return this._optionEx({},t,e,i,n)}requiredOption(t,e,i,n){return this._optionEx({mandatory:true},t,e,i,n)}combineFlagAndOptionalValue(t=true){this._combineFlagAndOptionalValue=!!t;return this}allowUnknownOption(t=true){this._allowUnknownOption=!!t;return this}allowExcessArguments(t=true){this._allowExcessArguments=!!t;return this}enablePositionalOptions(t=true){this._enablePositionalOptions=!!t;return this}passThroughOptions(t=true){this._passThroughOptions=!!t;if(!!this.parent&&t&&!this.parent._enablePositionalOptions){throw new Error("passThroughOptions can not be used without turning on enablePositionalOptions for parent command(s)")}return this}storeOptionsAsProperties(t=true){this._storeOptionsAsProperties=!!t;if(this.options.length){throw new Error("call .storeOptionsAsProperties() before adding options")}return this}getOptionValue(t){if(this._storeOptionsAsProperties){return this[t]}return this._optionValues[t]}setOptionValue(t,e){return this.setOptionValueWithSource(t,e,undefined)}setOptionValueWithSource(t,e,i){if(this._storeOptionsAsProperties){this[t]=e}else{this._optionValues[t]=e}this._optionValueSources[t]=i;return this}getOptionValueSource(t){return this._optionValueSources[t]}getOptionValueSourceWithGlobals(t){let e;getCommandAndParents(this).forEach((i=>{if(i.getOptionValueSource(t)!==undefined){e=i.getOptionValueSource(t)}}));return e}_prepareUserArgs(t,e){if(t!==undefined&&!Array.isArray(t)){throw new Error("first parameter to parse must be array or undefined")}e=e||{};if(t===undefined){t=a.argv;if(a.versions&&a.versions.electron){e.from="electron"}}this.rawArgs=t.slice();let i;switch(e.from){case undefined:case"node":this._scriptPath=t[1];i=t.slice(2);break;case"electron":if(a.defaultApp){this._scriptPath=t[1];i=t.slice(2)}else{i=t.slice(1)}break;case"user":i=t.slice(0);break;default:throw new Error(`unexpected parse option { from: '${e.from}' }`)}if(!this._name&&this._scriptPath)this.nameFromFilename(this._scriptPath);this._name=this._name||"program";return i}parse(t,e){const i=this._prepareUserArgs(t,e);this._parseCommand([],i);return this}async parseAsync(t,e){const i=this._prepareUserArgs(t,e);await this._parseCommand([],i);return this}_executeSubCommand(t,e){e=e.slice();let i=false;const n=[".js",".ts",".tsx",".mjs",".cjs"];function findFile(t,e){const i=r.resolve(t,e);if(o.existsSync(i))return i;if(n.includes(r.extname(e)))return undefined;const s=n.find((t=>o.existsSync(`${i}${t}`)));if(s)return`${i}${s}`;return undefined}this._checkForMissingMandatoryOptions();this._checkForConflictingOptions();let l=t._executableFile||`${this._name}-${t._name}`;let h=this._executableDir||"";if(this._scriptPath){let t;try{t=o.realpathSync(this._scriptPath)}catch(e){t=this._scriptPath}h=r.resolve(r.dirname(t),h)}if(h){let e=findFile(h,l);if(!e&&!t._executableFile&&this._scriptPath){const i=r.basename(this._scriptPath,r.extname(this._scriptPath));if(i!==this._name){e=findFile(h,`${i}-${t._name}`)}}l=e||l}i=n.includes(r.extname(l));let c;if(a.platform!=="win32"){if(i){e.unshift(l);e=incrementNodeInspectorPort(a.execArgv).concat(e);c=s.spawn(a.argv[0],e,{stdio:"inherit"})}else{c=s.spawn(l,e,{stdio:"inherit"})}}else{e.unshift(l);e=incrementNodeInspectorPort(a.execArgv).concat(e);c=s.spawn(a.execPath,e,{stdio:"inherit"})}if(!c.killed){const t=["SIGUSR1","SIGUSR2","SIGTERM","SIGINT","SIGHUP"];t.forEach((t=>{a.on(t,(()=>{if(c.killed===false&&c.exitCode===null){c.kill(t)}}))}))}const p=this._exitCallback;if(!p){c.on("close",a.exit.bind(a))}else{c.on("close",(()=>{p(new u(a.exitCode||0,"commander.executeSubCommandAsync","(close)"))}))}c.on("error",(e=>{if(e.code==="ENOENT"){const e=h?`searched for local subcommand relative to directory '${h}'`:"no directory for search for local subcommand, use .executableDir() to supply a custom directory";const i=`'${l}' does not exist\n - if '${t._name}' is not meant to be an executable command, remove description parameter from '.command()' and use '.description()' instead\n - if the default executable name is not suitable, use the executableFile option to supply a custom name or path\n - ${e}`;throw new Error(i)}else if(e.code==="EACCES"){throw new Error(`'${l}' not executable`)}if(!p){a.exit(1)}else{const t=new u(1,"commander.executeSubCommandAsync","(error)");t.nestedError=e;p(t)}}));this.runningCommand=c}_dispatchSubcommand(t,e,i){const n=this._findCommand(t);if(!n)this.help({error:true});let s;s=this._chainOrCallSubCommandHook(s,n,"preSubcommand");s=this._chainOrCall(s,(()=>{if(n._executableHandler){this._executeSubCommand(n,e.concat(i))}else{return n._parseCommand(e,i)}}));return s}_checkNumberOfArguments(){this._args.forEach(((t,e)=>{if(t.required&&this.args[e]==null){this.missingArgument(t.name())}}));if(this._args.length>0&&this._args[this._args.length-1].variadic){return}if(this.args.length>this._args.length){this._excessArguments(this.args)}}_processArguments(){const myParseArg=(t,e,i)=>{let n=e;if(e!==null&&t.parseArg){try{n=t.parseArg(e,i)}catch(i){if(i.code==="commander.invalidArgument"){const n=`error: command-argument value '${e}' is invalid for argument '${t.name()}'. ${i.message}`;this.error(n,{exitCode:i.exitCode,code:i.code})}throw i}}return n};this._checkNumberOfArguments();const t=[];this._args.forEach(((e,i)=>{let n=e.defaultValue;if(e.variadic){if(i<this.args.length){n=this.args.slice(i);if(e.parseArg){n=n.reduce(((t,i)=>myParseArg(e,i,t)),e.defaultValue)}}else if(n===undefined){n=[]}}else if(i<this.args.length){n=this.args[i];if(e.parseArg){n=myParseArg(e,n,e.defaultValue)}}t[i]=n}));this.processedArgs=t}_chainOrCall(t,e){if(t&&t.then&&typeof t.then==="function"){return t.then((()=>e()))}return e()}_chainOrCallHooks(t,e){let i=t;const n=[];getCommandAndParents(this).reverse().filter((t=>t._lifeCycleHooks[e]!==undefined)).forEach((t=>{t._lifeCycleHooks[e].forEach((e=>{n.push({hookedCommand:t,callback:e})}))}));if(e==="postAction"){n.reverse()}n.forEach((t=>{i=this._chainOrCall(i,(()=>t.callback(t.hookedCommand,this)))}));return i}_chainOrCallSubCommandHook(t,e,i){let n=t;if(this._lifeCycleHooks[i]!==undefined){this._lifeCycleHooks[i].forEach((t=>{n=this._chainOrCall(n,(()=>t(this,e)))}))}return n}_parseCommand(t,e){const i=this.parseOptions(e);this._parseOptionsEnv();this._parseOptionsImplied();t=t.concat(i.operands);e=i.unknown;this.args=t.concat(e);if(t&&this._findCommand(t[0])){return this._dispatchSubcommand(t[0],t.slice(1),e)}if(this._hasImplicitHelpCommand()&&t[0]===this._helpCommandName){if(t.length===1){this.help()}return this._dispatchSubcommand(t[1],[],[this._helpLongFlag])}if(this._defaultCommandName){outputHelpIfRequested(this,e);return this._dispatchSubcommand(this._defaultCommandName,t,e)}if(this.commands.length&&this.args.length===0&&!this._actionHandler&&!this._defaultCommandName){this.help({error:true})}outputHelpIfRequested(this,i.unknown);this._checkForMissingMandatoryOptions();this._checkForConflictingOptions();const checkForUnknownOptions=()=>{if(i.unknown.length>0){this.unknownOption(i.unknown[0])}};const n=`command:${this.name()}`;if(this._actionHandler){checkForUnknownOptions();this._processArguments();let i;i=this._chainOrCallHooks(i,"preAction");i=this._chainOrCall(i,(()=>this._actionHandler(this.processedArgs)));if(this.parent){i=this._chainOrCall(i,(()=>{this.parent.emit(n,t,e)}))}i=this._chainOrCallHooks(i,"postAction");return i}if(this.parent&&this.parent.listenerCount(n)){checkForUnknownOptions();this._processArguments();this.parent.emit(n,t,e)}else if(t.length){if(this._findCommand("*")){return this._dispatchSubcommand("*",t,e)}if(this.listenerCount("command:*")){this.emit("command:*",t,e)}else if(this.commands.length){this.unknownCommand()}else{checkForUnknownOptions();this._processArguments()}}else if(this.commands.length){checkForUnknownOptions();this.help({error:true})}else{checkForUnknownOptions();this._processArguments()}}_findCommand(t){if(!t)return undefined;return this.commands.find((e=>e._name===t||e._aliases.includes(t)))}_findOption(t){return this.options.find((e=>e.is(t)))}_checkForMissingMandatoryOptions(){for(let t=this;t;t=t.parent){t.options.forEach((e=>{if(e.mandatory&&t.getOptionValue(e.attributeName())===undefined){t.missingMandatoryOptionValue(e)}}))}}_checkForConflictingLocalOptions(){const t=this.options.filter((t=>{const e=t.attributeName();if(this.getOptionValue(e)===undefined){return false}return this.getOptionValueSource(e)!=="default"}));const e=t.filter((t=>t.conflictsWith.length>0));e.forEach((e=>{const i=t.find((t=>e.conflictsWith.includes(t.attributeName())));if(i){this._conflictingOption(e,i)}}))}_checkForConflictingOptions(){for(let t=this;t;t=t.parent){t._checkForConflictingLocalOptions()}}parseOptions(t){const e=[];const i=[];let n=e;const s=t.slice();function maybeOption(t){return t.length>1&&t[0]==="-"}let r=null;while(s.length){const t=s.shift();if(t==="--"){if(n===i)n.push(t);n.push(...s);break}if(r&&!maybeOption(t)){this.emit(`option:${r.name()}`,t);continue}r=null;if(maybeOption(t)){const e=this._findOption(t);if(e){if(e.required){const t=s.shift();if(t===undefined)this.optionMissingArgument(e);this.emit(`option:${e.name()}`,t)}else if(e.optional){let t=null;if(s.length>0&&!maybeOption(s[0])){t=s.shift()}this.emit(`option:${e.name()}`,t)}else{this.emit(`option:${e.name()}`)}r=e.variadic?e:null;continue}}if(t.length>2&&t[0]==="-"&&t[1]!=="-"){const e=this._findOption(`-${t[1]}`);if(e){if(e.required||e.optional&&this._combineFlagAndOptionalValue){this.emit(`option:${e.name()}`,t.slice(2))}else{this.emit(`option:${e.name()}`);s.unshift(`-${t.slice(2)}`)}continue}}if(/^--[^=]+=/.test(t)){const e=t.indexOf("=");const i=this._findOption(t.slice(0,e));if(i&&(i.required||i.optional)){this.emit(`option:${i.name()}`,t.slice(e+1));continue}}if(maybeOption(t)){n=i}if((this._enablePositionalOptions||this._passThroughOptions)&&e.length===0&&i.length===0){if(this._findCommand(t)){e.push(t);if(s.length>0)i.push(...s);break}else if(t===this._helpCommandName&&this._hasImplicitHelpCommand()){e.push(t);if(s.length>0)e.push(...s);break}else if(this._defaultCommandName){i.push(t);if(s.length>0)i.push(...s);break}}if(this._passThroughOptions){n.push(t);if(s.length>0)n.push(...s);break}n.push(t)}return{operands:e,unknown:i}}opts(){if(this._storeOptionsAsProperties){const t={};const e=this.options.length;for(let i=0;i<e;i++){const e=this.options[i].attributeName();t[e]=e===this._versionOptionName?this._version:this[e]}return t}return this._optionValues}optsWithGlobals(){return getCommandAndParents(this).reduce(((t,e)=>Object.assign(t,e.opts())),{})}error(t,e){this._outputConfiguration.outputError(`${t}\n`,this._outputConfiguration.writeErr);if(typeof this._showHelpAfterError==="string"){this._outputConfiguration.writeErr(`${this._showHelpAfterError}\n`)}else if(this._showHelpAfterError){this._outputConfiguration.writeErr("\n");this.outputHelp({error:true})}const i=e||{};const n=i.exitCode||1;const s=i.code||"commander.error";this._exit(n,s,t)}_parseOptionsEnv(){this.options.forEach((t=>{if(t.envVar&&t.envVar in a.env){const e=t.attributeName();if(this.getOptionValue(e)===undefined||["default","config","env"].includes(this.getOptionValueSource(e))){if(t.required||t.optional){this.emit(`optionEnv:${t.name()}`,a.env[t.envVar])}else{this.emit(`optionEnv:${t.name()}`)}}}}))}_parseOptionsImplied(){const t=new d(this.options);const hasCustomOptionValue=t=>this.getOptionValue(t)!==undefined&&!["default","implied"].includes(this.getOptionValueSource(t));this.options.filter((e=>e.implied!==undefined&&hasCustomOptionValue(e.attributeName())&&t.valueFromOption(this.getOptionValue(e.attributeName()),e))).forEach((t=>{Object.keys(t.implied).filter((t=>!hasCustomOptionValue(t))).forEach((e=>{this.setOptionValueWithSource(e,t.implied[e],"implied")}))}))}missingArgument(t){const e=`error: missing required argument '${t}'`;this.error(e,{code:"commander.missingArgument"})}optionMissingArgument(t){const e=`error: option '${t.flags}' argument missing`;this.error(e,{code:"commander.optionMissingArgument"})}missingMandatoryOptionValue(t){const e=`error: required option '${t.flags}' not specified`;this.error(e,{code:"commander.missingMandatoryOptionValue"})}_conflictingOption(t,e){const findBestOptionFromValue=t=>{const e=t.attributeName();const i=this.getOptionValue(e);const n=this.options.find((t=>t.negate&&e===t.attributeName()));const s=this.options.find((t=>!t.negate&&e===t.attributeName()));if(n&&(n.presetArg===undefined&&i===false||n.presetArg!==undefined&&i===n.presetArg)){return n}return s||t};const getErrorMessage=t=>{const e=findBestOptionFromValue(t);const i=e.attributeName();const n=this.getOptionValueSource(i);if(n==="env"){return`environment variable '${e.envVar}'`}return`option '${e.flags}'`};const i=`error: ${getErrorMessage(t)} cannot be used with ${getErrorMessage(e)}`;this.error(i,{code:"commander.conflictingOption"})}unknownOption(t){if(this._allowUnknownOption)return;let e="";if(t.startsWith("--")&&this._showSuggestionAfterError){let i=[];let n=this;do{const t=n.createHelp().visibleOptions(n).filter((t=>t.long)).map((t=>t.long));i=i.concat(t);n=n.parent}while(n&&!n._enablePositionalOptions);e=f(t,i)}const i=`error: unknown option '${t}'${e}`;this.error(i,{code:"commander.unknownOption"})}_excessArguments(t){if(this._allowExcessArguments)return;const e=this._args.length;const i=e===1?"":"s";const n=this.parent?` for '${this.name()}'`:"";const s=`error: too many arguments${n}. Expected ${e} argument${i} but got ${t.length}.`;this.error(s,{code:"commander.excessArguments"})}unknownCommand(){const t=this.args[0];let e="";if(this._showSuggestionAfterError){const i=[];this.createHelp().visibleCommands(this).forEach((t=>{i.push(t.name());if(t.alias())i.push(t.alias())}));e=f(t,i)}const i=`error: unknown command '${t}'${e}`;this.error(i,{code:"commander.unknownCommand"})}version(t,e,i){if(t===undefined)return this._version;this._version=t;e=e||"-V, --version";i=i||"output the version number";const n=this.createOption(e,i);this._versionOptionName=n.attributeName();this.options.push(n);this.on("option:"+n.name(),(()=>{this._outputConfiguration.writeOut(`${t}\n`);this._exit(0,"commander.version",t)}));return this}description(t,e){if(t===undefined&&e===undefined)return this._description;this._description=t;if(e){this._argsDescription=e}return this}summary(t){if(t===undefined)return this._summary;this._summary=t;return this}alias(t){if(t===undefined)return this._aliases[0];let e=this;if(this.commands.length!==0&&this.commands[this.commands.length-1]._executableHandler){e=this.commands[this.commands.length-1]}if(t===e._name)throw new Error("Command alias can't be the same as its name");e._aliases.push(t);return this}aliases(t){if(t===undefined)return this._aliases;t.forEach((t=>this.alias(t)));return this}usage(t){if(t===undefined){if(this._usage)return this._usage;const t=this._args.map((t=>h(t)));return[].concat(this.options.length||this._hasHelpOption?"[options]":[],this.commands.length?"[command]":[],this._args.length?t:[]).join(" ")}this._usage=t;return this}name(t){if(t===undefined)return this._name;this._name=t;return this}nameFromFilename(t){this._name=r.basename(t,r.extname(t));return this}executableDir(t){if(t===undefined)return this._executableDir;this._executableDir=t;return this}helpInformation(t){const e=this.createHelp();if(e.helpWidth===undefined){e.helpWidth=t&&t.error?this._outputConfiguration.getErrHelpWidth():this._outputConfiguration.getOutHelpWidth()}return e.formatHelp(this,e)}_getHelpContext(t){t=t||{};const e={error:!!t.error};let i;if(e.error){i=t=>this._outputConfiguration.writeErr(t)}else{i=t=>this._outputConfiguration.writeOut(t)}e.write=t.write||i;e.command=this;return e}outputHelp(t){let e;if(typeof t==="function"){e=t;t=undefined}const i=this._getHelpContext(t);getCommandAndParents(this).reverse().forEach((t=>t.emit("beforeAllHelp",i)));this.emit("beforeHelp",i);let n=this.helpInformation(i);if(e){n=e(n);if(typeof n!=="string"&&!Buffer.isBuffer(n)){throw new Error("outputHelp callback must return a string or a Buffer")}}i.write(n);this.emit(this._helpLongFlag);this.emit("afterHelp",i);getCommandAndParents(this).forEach((t=>t.emit("afterAllHelp",i)))}helpOption(t,e){if(typeof t==="boolean"){this._hasHelpOption=t;return this}this._helpFlags=t||this._helpFlags;this._helpDescription=e||this._helpDescription;const i=m(this._helpFlags);this._helpShortFlag=i.shortFlag;this._helpLongFlag=i.longFlag;return this}help(t){this.outputHelp(t);let e=a.exitCode||0;if(e===0&&t&&typeof t!=="function"&&t.error){e=1}this._exit(e,"commander.help","(outputHelp)")}addHelpText(t,e){const i=["beforeAll","before","after","afterAll"];if(!i.includes(t)){throw new Error(`Unexpected value for position to addHelpText.\nExpecting one of '${i.join("', '")}'`)}const n=`${t}Help`;this.on(n,(t=>{let i;if(typeof e==="function"){i=e({error:t.error,command:t.command})}else{i=e}if(i){t.write(`${i}\n`)}}));return this}}function outputHelpIfRequested(t,e){const i=t._hasHelpOption&&e.find((e=>e===t._helpLongFlag||e===t._helpShortFlag));if(i){t.outputHelp();t._exit(0,"commander.helpDisplayed","(outputHelp)")}}function incrementNodeInspectorPort(t){return t.map((t=>{if(!t.startsWith("--inspect")){return t}let e;let i="127.0.0.1";let n="9229";let s;if((s=t.match(/^(--inspect(-brk)?)$/))!==null){e=s[1]}else if((s=t.match(/^(--inspect(-brk|-port)?)=([^:]+)$/))!==null){e=s[1];if(/^\d+$/.test(s[3])){n=s[3]}else{i=s[3]}}else if((s=t.match(/^(--inspect(-brk|-port)?)=([^:]+):(\d+)$/))!==null){e=s[1];i=s[3];n=s[4]}if(e&&n!=="0"){return`${e}=${i}:${parseInt(n)+1}`}return t}))}function getCommandAndParents(t){const e=[];for(let i=t;i;i=i.parent){e.push(i)}return e}e.Command=Command},796:(t,e)=>{class CommanderError extends Error{constructor(t,e,i){super(i);Error.captureStackTrace(this,this.constructor);this.name=this.constructor.name;this.code=e;this.exitCode=t;this.nestedError=undefined}}class InvalidArgumentError extends CommanderError{constructor(t){super(1,"commander.invalidArgument",t);Error.captureStackTrace(this,this.constructor);this.name=this.constructor.name}}e.CommanderError=CommanderError;e.InvalidArgumentError=InvalidArgumentError},519:(t,e,i)=>{const{humanReadableArgName:n}=i(535);class Help{constructor(){this.helpWidth=undefined;this.sortSubcommands=false;this.sortOptions=false;this.showGlobalOptions=false}visibleCommands(t){const e=t.commands.filter((t=>!t._hidden));if(t._hasImplicitHelpCommand()){const[,i,n]=t._helpCommandnameAndArgs.match(/([^ ]+) *(.*)/);const s=t.createCommand(i).helpOption(false);s.description(t._helpCommandDescription);if(n)s.arguments(n);e.push(s)}if(this.sortSubcommands){e.sort(((t,e)=>t.name().localeCompare(e.name())))}return e}compareOptions(t,e){const getSortKey=t=>t.short?t.short.replace(/^-/,""):t.long.replace(/^--/,"");return getSortKey(t).localeCompare(getSortKey(e))}visibleOptions(t){const e=t.options.filter((t=>!t.hidden));const i=t._hasHelpOption&&t._helpShortFlag&&!t._findOption(t._helpShortFlag);const n=t._hasHelpOption&&!t._findOption(t._helpLongFlag);if(i||n){let s;if(!i){s=t.createOption(t._helpLongFlag,t._helpDescription)}else if(!n){s=t.createOption(t._helpShortFlag,t._helpDescription)}else{s=t.createOption(t._helpFlags,t._helpDescription)}e.push(s)}if(this.sortOptions){e.sort(this.compareOptions)}return e}visibleGlobalOptions(t){if(!this.showGlobalOptions)return[];const e=[];for(let i=t.parent;i;i=i.parent){const t=i.options.filter((t=>!t.hidden));e.push(...t)}if(this.sortOptions){e.sort(this.compareOptions)}return e}visibleArguments(t){if(t._argsDescription){t._args.forEach((e=>{e.description=e.description||t._argsDescription[e.name()]||""}))}if(t._args.find((t=>t.description))){return t._args}return[]}subcommandTerm(t){const e=t._args.map((t=>n(t))).join(" ");return t._name+(t._aliases[0]?"|"+t._aliases[0]:"")+(t.options.length?" [options]":"")+(e?" "+e:"")}optionTerm(t){return t.flags}argumentTerm(t){return t.name()}longestSubcommandTermLength(t,e){return e.visibleCommands(t).reduce(((t,i)=>Math.max(t,e.subcommandTerm(i).length)),0)}longestOptionTermLength(t,e){return e.visibleOptions(t).reduce(((t,i)=>Math.max(t,e.optionTerm(i).length)),0)}longestGlobalOptionTermLength(t,e){return e.visibleGlobalOptions(t).reduce(((t,i)=>Math.max(t,e.optionTerm(i).length)),0)}longestArgumentTermLength(t,e){return e.visibleArguments(t).reduce(((t,i)=>Math.max(t,e.argumentTerm(i).length)),0)}commandUsage(t){let e=t._name;if(t._aliases[0]){e=e+"|"+t._aliases[0]}let i="";for(let e=t.parent;e;e=e.parent){i=e.name()+" "+i}return i+e+" "+t.usage()}commandDescription(t){return t.description()}subcommandDescription(t){return t.summary()||t.description()}optionDescription(t){const e=[];if(t.argChoices){e.push(`choices: ${t.argChoices.map((t=>JSON.stringify(t))).join(", ")}`)}if(t.defaultValue!==undefined){const i=t.required||t.optional||t.isBoolean()&&typeof t.defaultValue==="boolean";if(i){e.push(`default: ${t.defaultValueDescription||JSON.stringify(t.defaultValue)}`)}}if(t.presetArg!==undefined&&t.optional){e.push(`preset: ${JSON.stringify(t.presetArg)}`)}if(t.envVar!==undefined){e.push(`env: ${t.envVar}`)}if(e.length>0){return`${t.description} (${e.join(", ")})`}return t.description}argumentDescription(t){const e=[];if(t.argChoices){e.push(`choices: ${t.argChoices.map((t=>JSON.stringify(t))).join(", ")}`)}if(t.defaultValue!==undefined){e.push(`default: ${t.defaultValueDescription||JSON.stringify(t.defaultValue)}`)}if(e.length>0){const i=`(${e.join(", ")})`;if(t.description){return`${t.description} ${i}`}return i}return t.description}formatHelp(t,e){const i=e.padWidth(t,e);const n=e.helpWidth||80;const s=2;const r=2;function formatItem(t,o){if(o){const a=`${t.padEnd(i+r)}${o}`;return e.wrap(a,n-s,i+r)}return t}function formatList(t){return t.join("\n").replace(/^/gm," ".repeat(s))}let o=[`Usage: ${e.commandUsage(t)}`,""];const a=e.commandDescription(t);if(a.length>0){o=o.concat([e.wrap(a,n,0),""])}const l=e.visibleArguments(t).map((t=>formatItem(e.argumentTerm(t),e.argumentDescription(t))));if(l.length>0){o=o.concat(["Arguments:",formatList(l),""])}const h=e.visibleOptions(t).map((t=>formatItem(e.optionTerm(t),e.optionDescription(t))));if(h.length>0){o=o.concat(["Options:",formatList(h),""])}if(this.showGlobalOptions){const i=e.visibleGlobalOptions(t).map((t=>formatItem(e.optionTerm(t),e.optionDescription(t))));if(i.length>0){o=o.concat(["Global Options:",formatList(i),""])}}const u=e.visibleCommands(t).map((t=>formatItem(e.subcommandTerm(t),e.subcommandDescription(t))));if(u.length>0){o=o.concat(["Commands:",formatList(u),""])}return o.join("\n")}padWidth(t,e){return Math.max(e.longestOptionTermLength(t,e),e.longestGlobalOptionTermLength(t,e),e.longestSubcommandTermLength(t,e),e.longestArgumentTermLength(t,e))}wrap(t,e,i,n=40){const s=" \\f\\t\\v   -   　\ufeff";const r=new RegExp(`[\\n][${s}]+`);if(t.match(r))return t;const o=e-i;if(o<n)return t;const a=t.slice(0,i);const l=t.slice(i).replace("\r\n","\n");const h=" ".repeat(i);const u="​";const c=`\\s${u}`;const p=new RegExp(`\n|.{1,${o-1}}([${c}]|$)|[^${c}]+?([${c}]|$)`,"g");const m=l.match(p)||[];return a+m.map(((t,e)=>{if(t==="\n")return"";return(e>0?h:"")+t.trimEnd()})).join("\n")}}e.Help=Help},437:(t,e,i)=>{const{InvalidArgumentError:n}=i(796);class Option{constructor(t,e){this.flags=t;this.description=e||"";this.required=t.includes("<");this.optional=t.includes("[");this.variadic=/\w\.\.\.[>\]]$/.test(t);this.mandatory=false;const i=splitOptionFlags(t);this.short=i.shortFlag;this.long=i.longFlag;this.negate=false;if(this.long){this.negate=this.long.startsWith("--no-")}this.defaultValue=undefined;this.defaultValueDescription=undefined;this.presetArg=undefined;this.envVar=undefined;this.parseArg=undefined;this.hidden=false;this.argChoices=undefined;this.conflictsWith=[];this.implied=undefined}default(t,e){this.defaultValue=t;this.defaultValueDescription=e;return this}preset(t){this.presetArg=t;return this}conflicts(t){this.conflictsWith=this.conflictsWith.concat(t);return this}implies(t){this.implied=Object.assign(this.implied||{},t);return this}env(t){this.envVar=t;return this}argParser(t){this.parseArg=t;return this}makeOptionMandatory(t=true){this.mandatory=!!t;return this}hideHelp(t=true){this.hidden=!!t;return this}_concatValue(t,e){if(e===this.defaultValue||!Array.isArray(e)){return[t]}return e.concat(t)}choices(t){this.argChoices=t.slice();this.parseArg=(t,e)=>{if(!this.argChoices.includes(t)){throw new n(`Allowed choices are ${this.argChoices.join(", ")}.`)}if(this.variadic){return this._concatValue(t,e)}return t};return this}name(){if(this.long){return this.long.replace(/^--/,"")}return this.short.replace(/^-/,"")}attributeName(){return camelcase(this.name().replace(/^no-/,""))}is(t){return this.short===t||this.long===t}isBoolean(){return!this.required&&!this.optional&&!this.negate}}class DualOptions{constructor(t){this.positiveOptions=new Map;this.negativeOptions=new Map;this.dualOptions=new Set;t.forEach((t=>{if(t.negate){this.negativeOptions.set(t.attributeName(),t)}else{this.positiveOptions.set(t.attributeName(),t)}}));this.negativeOptions.forEach(((t,e)=>{if(this.positiveOptions.has(e)){this.dualOptions.add(e)}}))}valueFromOption(t,e){const i=e.attributeName();if(!this.dualOptions.has(i))return true;const n=this.negativeOptions.get(i).presetArg;const s=n!==undefined?n:false;return e.negate===(s===t)}}function camelcase(t){return t.split("-").reduce(((t,e)=>t+e[0].toUpperCase()+e.slice(1)))}function splitOptionFlags(t){let e;let i;const n=t.split(/[ |,]+/);if(n.length>1&&!/^[[<]/.test(n[1]))e=n.shift();i=n.shift();if(!e&&/^-[^-]$/.test(i)){e=i;i=undefined}return{shortFlag:e,longFlag:i}}e.Option=Option;e.splitOptionFlags=splitOptionFlags;e.DualOptions=DualOptions},860:(t,e)=>{const i=3;function editDistance(t,e){if(Math.abs(t.length-e.length)>i)return Math.max(t.length,e.length);const n=[];for(let e=0;e<=t.length;e++){n[e]=[e]}for(let t=0;t<=e.length;t++){n[0][t]=t}for(let i=1;i<=e.length;i++){for(let s=1;s<=t.length;s++){let r=1;if(t[s-1]===e[i-1]){r=0}else{r=1}n[s][i]=Math.min(n[s-1][i]+1,n[s][i-1]+1,n[s-1][i-1]+r);if(s>1&&i>1&&t[s-1]===e[i-2]&&t[s-2]===e[i-1]){n[s][i]=Math.min(n[s][i],n[s-2][i-2]+1)}}}return n[t.length][e.length]}function suggestSimilar(t,e){if(!e||e.length===0)return"";e=Array.from(new Set(e));const n=t.startsWith("--");if(n){t=t.slice(2);e=e.map((t=>t.slice(2)))}let s=[];let r=i;const o=.4;e.forEach((e=>{if(e.length<=1)return;const i=editDistance(t,e);const n=Math.max(t.length,e.length);const a=(n-i)/n;if(a>o){if(i<r){r=i;s=[e]}else if(i===r){s.push(e)}}}));s.sort(((t,e)=>t.localeCompare(e)));if(n){s=s.map((t=>`--${t}`))}if(s.length>1){return`\n(Did you mean one of ${s.join(", ")}?)`}if(s.length===1){return`\n(Did you mean ${s[0]}?)`}return""}e.suggestSimilar=suggestSimilar}};var e={};function __nccwpck_require__(i){var n=e[i];if(n!==undefined){return n.exports}var s=e[i]={exports:{}};var r=true;try{t[i](s,s.exports,__nccwpck_require__);r=false}finally{if(r)delete e[i]}return s.exports}if(typeof __nccwpck_require__!=="undefined")__nccwpck_require__.ab=__dirname+"/";var i=__nccwpck_require__(632);module.exports=i})();