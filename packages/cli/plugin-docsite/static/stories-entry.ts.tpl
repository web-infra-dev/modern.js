<% _.forEach(entries, function(entry) { %>
import * as <%= entry.name %> from '<%= entry.path %>';
<% }) %>

export { <%= entries.map(({ name }) => name).join(', ') %> };

