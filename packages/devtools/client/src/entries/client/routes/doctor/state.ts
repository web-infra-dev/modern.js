import { proxy } from 'valtio';
import { $server } from '../state';

const _request = $server.then(server => server.remote.getDoctorOverview());

export const $doctor = proxy({
  errors: _request.then(res => res.errors),
  numChunks: _request.then(res => res.numChunks),
  numModules: _request.then(res => res.numModules),
  numPackages: _request.then(res => res.numPackages),
  summary: _request.then(res => res.summary),
});
