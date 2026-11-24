import { WindWeather } from '../../provider/src/weather-ui';
import { withRenderFailure } from '../../provider/src/render-failure';
import type { ComponentProps } from 'react';
function VersionedWind(props: ComponentProps<typeof WindWeather>) {
  return (
    <WindWeather
      {...props}
      attribution={
        props.attribution ??
        `Dynamic nested · Rslib · ${process.env.MF_LAB_VERSION || 'v1'}`
      }
    />
  );
}
export default withRenderFailure(VersionedWind);
