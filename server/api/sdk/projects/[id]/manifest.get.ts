import {
  getSdkProjectManifest,
  readAuthorizedSdkProject,
} from "../../../../data/sdkProjects";

export default defineEventHandler((event) => {
  const project = readAuthorizedSdkProject(event);

  return {
    project: getSdkProjectManifest(project),
    generatedAt: new Date().toISOString(),
  };
});
