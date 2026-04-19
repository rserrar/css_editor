type Props = {
  connected: boolean;
};

export function ConnectionStatus({ connected }: Props) {
  return <span>{connected ? 'Preview connectada' : 'Sense connexió'}</span>;
}
