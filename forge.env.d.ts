interface Window {
  updater?: {
    onSuccess: (cb: (version: string) => void) => () => void;
  };
}