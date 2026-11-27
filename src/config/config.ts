const configuredBaseUrl = 'http://localhost:9925';

export const mealieComposeProject = 'playwright-portfolio-mealie-test';

const parsedBaseUrl = new URL(configuredBaseUrl);
if (
  parsedBaseUrl.protocol !== 'http:' ||
  parsedBaseUrl.hostname !== 'localhost' ||
  parsedBaseUrl.port === '0' ||
  parsedBaseUrl.username ||
  parsedBaseUrl.password ||
  parsedBaseUrl.pathname !== '/' ||
  parsedBaseUrl.search ||
  parsedBaseUrl.hash
) {
  throw new Error('Mealie base URL must be a local HTTP origin, for example http://localhost:9925.');
}

export const mealieBaseUrl = parsedBaseUrl.origin;
