import path from 'path';
import { globby } from '@modern-js/utils';
import { fs } from '@modern-js/generator-utils';

export enum FileType {
  Text = 'text',
  Binary = 'binary',
  Json = 'json',
  TextRaw = 'textRaw',
  // Ini = 'ini'
}
export interface AddFileParams {
  type: FileType;
  file: string; // new file path
  template?: string; // template content
  templateFile?: string; // template file path
  force?: boolean; // if file is exit, whether force to cover file
  data?: Record<string, string>; // template data
}

export interface AddManyFilesParams {
  type: FileType;
  destination: string; // target dir
  templateFiles: string[] | (() => string[]); // templates files
  templateBase?: string; // template base path, targetPath = templateFile - base
  fileNameFunc?: (name: string) => string;
  data?: Record<string, string>; // template data
}

export async function fileExists(filePath: string) {
  try {
    await fs.access(filePath);
    return true;
  } catch (e) {
    return false;
  }
}

function dropFileRootFolder(file: string) {
  const fileParts = path.normalize(file).split(path.sep);
  fileParts.shift();

  return fileParts.join(path.sep);
}

function dropFileRootPath(file: string, rootPath?: string) {
  const fileRootPath = rootPath
    ? file.replace(rootPath, '')
    : dropFileRootFolder(file);
  return fileRootPath.startsWith(path.sep)
    ? fileRootPath
    : `${path.sep}${fileRootPath}`;
}

function isAbsoluteOrRelativeFileTo(relativePath: string) {
  const isFile = (file: string) =>
    fs.existsSync(file) && fs.lstatSync(file).isFile();
  return (fileName: string) =>
    isFile(fileName) || isFile(path.join(relativePath, fileName));
}

export async function addFile(
  config: AddFileParams,
  projectPath: string,
  templatePath: string,
  renderString: (content?: string, data?: Record<string, string>) => string,
) {
  const fileDestPath = path.join(projectPath, config.file);

  const destExists = await fileExists(fileDestPath);
  if (destExists && !config.force) {
    throw Error(`File ${fileDestPath} already exists`);
  }
  await fs.mkdir(path.dirname(fileDestPath), { recursive: true });
  const absTemplatePath = config.templateFile
    ? path.join(templatePath, config.templateFile)
    : null;
  if (
    absTemplatePath != null &&
    (config.type === FileType.Binary ||
      Object.keys(config.data || {}).length === 0)
  ) {
    const rawTemplate = await fs.readFile(absTemplatePath);
    await fs.writeFile(fileDestPath, rawTemplate);
  } else {
    let { template } = config;
    if (absTemplatePath) {
      template = await fs.readFile(absTemplatePath, 'utf8');
    }
    await fs.writeFile(
      fileDestPath,
      renderString(template, config.data || {})!,
      'utf8',
    );
  }
}

export async function addManyFiles(
  config: AddManyFilesParams,
  projectPath: string,
  templatePath: string,
  renderString: (content?: string, data?: Record<string, string>) => string,
) {
  const dest = config.destination;
  if (typeof dest !== 'string') {
    throw Error(`Invalid destination "${dest}"`);
  }
  if (typeof config.templateFiles === 'function') {
    config.templateFiles = config.templateFiles();
  }

  config.templateFiles = config.templateFiles.map(templateFile =>
    path.join(templatePath, templateFile),
  );

  config.templateBase = config.templateBase?.startsWith(path.sep)
    ? config.templateBase
    : `${path.sep}${config.templateBase || ''}`;

  const templateFiles = globby
    .sync(config.templateFiles, { braceExpansion: false })
    .map(filePath => dropFileRootPath(filePath, templatePath))
    .filter(filePath => filePath.startsWith(config.templateBase || ''))
    .filter(isAbsoluteOrRelativeFileTo(templatePath));

  const filesAdded = [];
  for (const templateFile of templateFiles) {
    const absTemplatePath = path.resolve(templatePath, templateFile);
    const targetFile = dropFileRootPath(templateFile, config.templateBase);
    const fileCfg = {
      ...config,
      file: path.join(
        config.destination,
        config.fileNameFunc ? config.fileNameFunc(targetFile) : targetFile,
      ),
      templateFile: absTemplatePath,
      force: true,
    };
    const addedPath = await addFile(
      fileCfg,
      projectPath,
      templatePath,
      renderString,
    );
    filesAdded.push(addedPath);
  }
}
