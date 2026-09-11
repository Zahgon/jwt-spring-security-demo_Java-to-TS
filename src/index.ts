import { readFileSync } from 'node:fs';
import { createApplication } from './application';
import { applicationProperties, resourcePath } from './config/properties';

/**
 * Port of `JwtDemoApplication` — the entry point that `SpringApplication.run` provided.
 */
function main(): void {
   process.stdout.write(`${readFileSync(resourcePath('banner.txt'), 'utf8')}\n`);

   const { server } = applicationProperties();
   const app = createApplication();

   app.listen(server.port, () => {
      console.log(`Started JwtDemoApplication on port ${server.port}`);
   });
}

if (require.main === module) {
   main();
}

export { createApplication };
