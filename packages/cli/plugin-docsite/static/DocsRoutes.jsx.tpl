import React from 'react';
import {
  Switch,
  Route,
  Redirect,
} from "react-router-dom";

const DocsRoutes = ({ meta }) => {
  return (
    <Switch>
      <Redirect exact from='/' to="/<%= meta[0].moduleName %>" />
      <% meta.forEach(function(page) { %>
      <Route path={'/<%= page.moduleName %>'} component={require('./<%= page.moduleName %>/index').default}/>
      <% }); %>
    </Switch>
  );
};

export default DocsRoutes;
