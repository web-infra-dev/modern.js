import ReactHelmet, { HelmetData } from 'react-helmet';
import helmetReplace from '../helmet';
import {
  HEAD_REG_EXP,
  BuildTemplateCb,
  buildTemplate,
} from './buildTemplate.share';

// build head template
function getHeadTemplate(beforeEntryTemplate: string) {
  const callbacks: BuildTemplateCb[] = [
    headTemplate => {
      const helmetData: HelmetData = ReactHelmet.renderStatic();
      return helmetData
        ? helmetReplace(headTemplate, helmetData)
        : headTemplate;
    },
  ];

  const [headTemplate = ''] = beforeEntryTemplate.match(HEAD_REG_EXP) || [];
  if (!headTemplate.length) {
    return '';
  }
  return buildTemplate(headTemplate, callbacks);

  // @TODO: inject css chunks of lazy components

  // @TODO: prefetch scripts of lazy component
}

// build script
export function buildShellBeforeTemplate(beforeAppTemplate: string) {
  const headTemplate = getHeadTemplate(beforeAppTemplate);
  return beforeAppTemplate.replace(HEAD_REG_EXP, headTemplate);
}
