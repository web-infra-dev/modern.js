/** should be transformed */
import 'core-js/foo/bar'
import '@swc/helpers/foo/bar'

/** should stay as is */
import 'core-js-pure/foo/bar'
import '@swc/helpers-custom/foo/bar'
