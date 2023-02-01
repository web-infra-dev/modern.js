---
sidebar_position: 2
---

# Why module project solution

You've probably all experienced it: when developing a component library or tool library from scratch, we have to consider not only how to write the code logic of the project itself, but also how to build, debug, test, format the code, and other things that have nothing to do with the code logic.

For example, when we consider which builder is used to build the code for a module project, we might previously consider [webpack](https://webpack.js.org/) or [Rollup](https://rollupjs.org/guide/en/), but now we might also consider [esbuild](https://esbuild.github.io/) or [SWC](https://swc.rs/).

Regardless of which builder is chosen, this is going to be a costly learning curve for developers who are not skilled in the use of these build tools. Even if you want to use them quickly, it will take a lot of time and effort.

In addition to the build, things like providing debugging tools for projects, supporting testing capabilities, adding code format validation, etc. can take a long time and effort for a novice to understand or master them and actually serve the current project.

To ensure the quality of the code and the integrity of the project, we often need to do these things that are not related to the logical implementation of the code. However, these things are likely to affect the overall project development progress, reduce the developer's development experience, and make the developer feel that the development threshold of the module project is very high.

If you have to go through all this work every time you develop a module type project, you will spend most of your development time in the beginning on these things that are not related to code implementation. If we could provide a module engineering solution that would help developers to solve the project engineering issues and allow them to focus more on code implementation, it would greatly improve the module type project development experience.

![Not using engineering solution vs. using engineering solution](https://lf3-static.bytednsdoc.com/obj/eden-cn/uhbfnupenuhf/module-tools/why-module-solution.png)

Modern.js, in order to make developing module type projects easier, provides a module engineering solution in order to solve the above mentioned problems and provides the main features using Module Tools. **Module-tools can be understood as a tool dedicated to the development of module type projects**.
