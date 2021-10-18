export const EN_LOCALE = {
  get_packages_error:
    'get all packages failed，please check this environment and try again',
  success: `Success！
You can run the following command in the directory of the new project：
{packageManager} dev          # Run and debug the project according to the requirements of the development environment
{packageManager} build        # Build the project according to the requirements of the product environment
{packageManager} start        # Run the project according to the requirements of the product environment
{packageManager} lint         # Check and fix all codes
{packageManager} new          # Create more project elements, such as application portals`,
  electron: {
    success: `
{packageManager} dev:electron # Run and debug the Electron project according to the requirements of the development environment
{packageManager} build:electron # Build the Electron project according to the requirements of the product environment
  `,
  },
};
