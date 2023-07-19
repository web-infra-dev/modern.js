## Deploy the Application

After executing `builder build` to build the application, you will get a set of static assets in the `dist` directory. These assets can be deployed to any platform or server.

Please note that the default output structure of Builder may not be suitable for all platforms because different platforms have different requirements for the directory structure. You can refer to the [Output Files](/guide/basic/output-files) section to modify the directory structure to meet the requirements of your deployment platform.

Additionally, if you need to preview the deployment artifacts locally, you can use the [builder serve](/guide/basic/builder-cli#builder-serve) command provided by Builder CLI.
