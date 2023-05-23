import type {
  SriOptions,
  SharedSecurityConfig,
} from '@modern-js/builder-shared';

export type SecurityConfig = SharedSecurityConfig & {
  /**
   * Adding an integrity attribute (`integrity`) to sub-resources introduced by HTML allows the browser to
   * verify the integrity of the introduced resource, thus preventing tampering with the downloaded resource.
   */
  sri?: SriOptions | boolean;
};

export type NormalizedSecurityConfig = Required<SecurityConfig>;
