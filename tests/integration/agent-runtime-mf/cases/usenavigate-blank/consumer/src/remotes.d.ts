declare module 'useNavigateBlankProvider/export-app' {
  export const provider: () => {
    render(info: {
      dom: HTMLElement;
      basename?: string;
      [key: string]: unknown;
    }): void | Promise<void>;
    destroy(info: { dom: HTMLElement }): void;
  };

  export default provider;
}
