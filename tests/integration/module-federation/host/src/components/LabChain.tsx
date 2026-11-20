import modernLogo from './modern.ico';
import { LabIcon } from './LabIcon';

export function LabChain({
  nested = false,
  service = false,
}: {
  nested?: boolean;
  service?: boolean;
}) {
  return (
    <span className="lab-chain">
      <span title="Host">
        <LabIcon name="browser" />
        <span className="lab-visually-hidden">Host</span>
      </span>
      <span aria-hidden="true">→</span>
      {service ? (
        <span title="Service App">
          <LabIcon name="server" />
          <span className="lab-visually-hidden">Service App</span>
        </span>
      ) : (
        <img src={modernLogo} alt="Modern.js" title="Modern.js" />
      )}
      {nested && (
        <>
          <span aria-hidden="true">→</span>
          <span title="Rslib">
            <LabIcon name="code" /> Rslib
          </span>
        </>
      )}
    </span>
  );
}
