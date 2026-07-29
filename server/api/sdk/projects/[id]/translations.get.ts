import {
  buildSdkTranslations,
  getSdkProjectManifest,
  readAuthorizedSdkProject,
} from "../../../../data/sdkProjects";

export default defineEventHandler((event) => {
  const project = readAuthorizedSdkProject(event);
  const query = getQuery(event);

  return {
    project: getSdkProjectManifest(project),
    translations: buildSdkTranslations(project, query),
    generatedAt: new Date().toISOString(),
  };
});
