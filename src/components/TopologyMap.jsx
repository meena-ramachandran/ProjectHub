import React from 'react';

export default function TopologyMap({ activeFlow }) {
  // activeFlow can be: 'register', 'schedule', 'conflict', 'cancel', 'auth', or null

  const flows = {
    auth: [
      { from: 'client', to: 'gateway' },
      { from: 'gateway', to: 'auth' }
    ],
    register: [
      { from: 'client', to: 'gateway' },
      { from: 'gateway', to: 'patient' },
      { from: 'patient', to: 'billing', type: 'grpc' },
      { from: 'patient', to: 'kafka', type: 'kafka' },
      { from: 'kafka', to: 'analytics' }
    ],
    schedule: [
      { from: 'client', to: 'gateway' },
      { from: 'gateway', to: 'appointment' },
      { from: 'appointment', to: 'billing', type: 'grpc' },
      { from: 'appointment', to: 'kafka', type: 'kafka' },
      { from: 'kafka', to: 'analytics' }
    ],
    conflict: [
      { from: 'client', to: 'gateway' },
      { from: 'gateway', to: 'appointment', error: true }
    ],
    cancel: [
      { from: 'client', to: 'gateway' },
      { from: 'gateway', to: 'appointment' },
      { from: 'appointment', to: 'billing', type: 'grpc' },
      { from: 'appointment', to: 'kafka', type: 'kafka' },
      { from: 'kafka', to: 'analytics' }
    ]
  };

  const currentFlow = flows[activeFlow] || [];

  const isLinkActive = (fromNode, toNode) => {
    return currentFlow.some(link => link.from === fromNode && link.to === toNode);
  };

  const isLinkError = (fromNode, toNode) => {
    return currentFlow.some(link => link.from === fromNode && link.to === toNode && link.error);
  };

  // Node Positions (x, y)
  const coords = {
    client: { x: 50, y: 150 },
    gateway: { x: 220, y: 150 },
    auth: { x: 420, y: 50 },
    patient: { x: 420, y: 120 },
    appointment: { x: 420, y: 190 },
    analytics: { x: 420, y: 260 },
    billing: { x: 650, y: 150 },
    kafka: { x: 650, y: 260 }
  };

  const renderLink = (fromNode, toNode, label = '', isBelow = false) => {
    const from = coords[fromNode];
    const to = coords[toNode];
    const active = isLinkActive(fromNode, toNode);
    const error = isLinkError(fromNode, toNode);
    
    // Line calculations
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const midX = from.x + dx / 2;
    const midY = from.y + dy / 2;

    let pathD = `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
    // Curved line to billing from patient/appointment
    if ((fromNode === 'patient' || fromNode === 'appointment') && toNode === 'billing') {
      pathD = `M ${from.x} ${from.y} Q ${midX + 20} ${midY - 10} ${to.x} ${to.y}`;
    }

    let strokeColor = 'rgba(255, 255, 255, 0.15)';
    if (active) strokeColor = error ? 'var(--color-rose)' : 'var(--color-violet)';

    return (
      <g key={`${fromNode}-${toNode}`}>
        <path
          d={pathD}
          fill="none"
          stroke={strokeColor}
          strokeWidth={active ? 3 : 1.5}
          className={active && !error ? 'flow-active' : ''}
          style={{ transition: 'var(--transition-smooth)' }}
        />
        {/* Animated packet */}
        {active && !error && (
          <circle r="5" fill="var(--color-cyan)" className="filter drop-shadow-[0_0_8px_var(--color-cyan)]">
            <animateMotion dur="1.2s" repeatCount="indefinite" path={pathD} />
          </circle>
        )}
        {/* Label */}
        {label && (
          <text
            x={midX}
            y={midY + (isBelow ? 15 : -8)}
            fill={active ? 'var(--color-violet)' : 'var(--color-text-muted)'}
            fontSize="10"
            fontFamily="var(--font-mono)"
            textAnchor="middle"
            style={{ transition: 'var(--transition-smooth)' }}
          >
            {label}
          </text>
        )}
      </g>
    );
  };

  return (
    <div className="glass p-6 mb-6 flex flex-col items-center">
      <div className="flex justify-between w-full mb-4 items-center">
        <h4 className="text-sm font-semibold tracking-wider text-slate-400 uppercase">Live Microservices Topology Map</h4>
        <div className="flex gap-4 text-xs font-mono">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-slate-600 rounded-full inline-block"></span> HTTP</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-violet-500 rounded-full inline-block"></span> gRPC</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-cyan-400 rounded-full inline-block animate-pulse"></span> Kafka</span>
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <svg viewBox="0 0 780 340" className="w-full min-w-[700px] h-auto">
          {/* Grid lines background */}
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255, 255, 255, 0.02)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" rx="10" />

          {/* Connection Links */}
          {renderLink('client', 'gateway', 'HTTP/JWT')}
          {renderLink('gateway', 'auth', 'Route /auth')}
          {renderLink('gateway', 'patient', 'Route /patients')}
          {renderLink('gateway', 'appointment', 'Route /appointments')}
          {renderLink('gateway', 'analytics', 'Route /analytics')}
          
          {renderLink('patient', 'billing', 'gRPC (Create)', false)}
          {renderLink('appointment', 'billing', 'gRPC (Charge)', true)}

          {renderLink('patient', 'kafka', 'event', true)}
          {renderLink('appointment', 'kafka', 'event', false)}
          {renderLink('billing', 'kafka', 'event', false)}

          {renderLink('kafka', 'analytics', 'Asynchronous consume', true)}

          {/* Node: Client */}
          <g transform={`translate(${coords.client.x}, ${coords.client.y})`}>
            <circle r="30" fill="rgba(30, 27, 75, 0.6)" stroke="var(--color-indigo)" strokeWidth="1.5" />
            <text textAnchor="middle" y="4" fill="white" fontSize="10" fontWeight="bold">Client App</text>
            <text textAnchor="middle" y="42" fill="var(--color-text-secondary)" fontSize="10" fontFamily="var(--font-mono)">Browser</text>
          </g>

          {/* Node: Gateway */}
          <g transform={`translate(${coords.gateway.x}, ${coords.gateway.y})`}>
            <rect x="-45" y="-25" width="90" height="50" rx="8" fill="rgba(15, 23, 42, 0.8)" stroke={activeFlow ? 'var(--color-violet)' : 'rgba(255,255,255,0.1)'} strokeWidth="1.5" style={{ transition: 'var(--transition-smooth)' }} />
            <text textAnchor="middle" y="-2" fill="white" fontSize="10" fontWeight="bold">API Gateway</text>
            <text textAnchor="middle" y="10" fill="var(--color-text-muted)" fontSize="8" fontFamily="var(--font-mono)">Port 4007</text>
            <text textAnchor="middle" y="38" fill="var(--color-text-secondary)" fontSize="9" fontFamily="var(--font-mono)">Spring Cloud</text>
          </g>

          {/* Node: Auth Service */}
          <g transform={`translate(${coords.auth.x}, ${coords.auth.y})`}>
            <rect x="-50" y="-20" width="100" height="40" rx="6" fill="rgba(30, 41, 59, 0.7)" stroke={activeFlow === 'auth' ? 'var(--color-violet)' : 'rgba(255,255,255,0.1)'} strokeWidth="1.5" style={{ transition: 'var(--transition-smooth)' }} />
            <text textAnchor="middle" y="2" fill="white" fontSize="9" fontWeight="bold">auth-service</text>
            <text textAnchor="middle" y="12" fill="var(--color-text-muted)" fontSize="7" fontFamily="var(--font-mono)">Port 4005</text>
          </g>

          {/* Node: Patient Service */}
          <g transform={`translate(${coords.patient.x}, ${coords.patient.y})`}>
            <rect x="-50" y="-20" width="100" height="40" rx="6" fill="rgba(30, 41, 59, 0.7)" stroke={activeFlow === 'register' ? 'var(--color-violet)' : 'rgba(255,255,255,0.1)'} strokeWidth="1.5" style={{ transition: 'var(--transition-smooth)' }} />
            <text textAnchor="middle" y="2" fill="white" fontSize="9" fontWeight="bold">patient-service</text>
            <text textAnchor="middle" y="12" fill="var(--color-text-muted)" fontSize="7" fontFamily="var(--font-mono)">Port 4000</text>
          </g>

          {/* Node: Appointment Service */}
          <g transform={`translate(${coords.appointment.x}, ${coords.appointment.y})`}>
            <rect x="-50" y="-20" width="100" height="40" rx="6" fill="rgba(30, 41, 59, 0.7)" stroke={activeFlow === 'schedule' || activeFlow === 'conflict' || activeFlow === 'cancel' ? (activeFlow === 'conflict' ? 'var(--color-rose)' : 'var(--color-violet)') : 'rgba(255,255,255,0.1)'} strokeWidth="1.5" style={{ transition: 'var(--transition-smooth)' }} />
            <text textAnchor="middle" y="2" fill="white" fontSize="9" fontWeight="bold">appointment-service</text>
            <text textAnchor="middle" y="12" fill="var(--color-text-muted)" fontSize="7" fontFamily="var(--font-mono)">Port 4006</text>
          </g>

          {/* Node: Analytics Service */}
          <g transform={`translate(${coords.analytics.x}, ${coords.analytics.y})`}>
            <rect x="-50" y="-20" width="100" height="40" rx="6" fill="rgba(30, 41, 59, 0.7)" stroke={activeFlow && activeFlow !== 'auth' && activeFlow !== 'conflict' ? 'var(--color-violet)' : 'rgba(255,255,255,0.1)'} strokeWidth="1.5" style={{ transition: 'var(--transition-smooth)' }} />
            <text textAnchor="middle" y="2" fill="white" fontSize="9" fontWeight="bold">analytics-service</text>
            <text textAnchor="middle" y="12" fill="var(--color-text-muted)" fontSize="7" fontFamily="var(--font-mono)">Port 4004</text>
          </g>

          {/* Node: Billing Service */}
          <g transform={`translate(${coords.billing.x}, ${coords.billing.y})`}>
            <rect x="-50" y="-25" width="100" height="50" rx="8" fill="rgba(6, 78, 59, 0.5)" stroke={activeFlow && activeFlow !== 'auth' && activeFlow !== 'conflict' ? 'var(--color-emerald)' : 'rgba(255,255,255,0.1)'} strokeWidth="1.5" style={{ transition: 'var(--transition-smooth)' }} />
            <text textAnchor="middle" y="-2" fill="white" fontSize="9" fontWeight="bold">billing-service</text>
            <text textAnchor="middle" y="8" fill="var(--color-emerald)" fontSize="8" fontFamily="var(--font-mono)">Port 4002</text>
            <text textAnchor="middle" y="18" fill="var(--color-text-muted)" fontSize="8" fontFamily="var(--font-mono)">gRPC Broker</text>
          </g>

          {/* Node: Kafka Broker */}
          <g transform={`translate(${coords.kafka.x}, ${coords.kafka.y})`}>
            <ellipse rx="45" ry="22" fill="rgba(8, 51, 68, 0.6)" stroke={activeFlow && activeFlow !== 'auth' && activeFlow !== 'conflict' ? 'var(--color-cyan)' : 'rgba(255,255,255,0.1)'} strokeWidth="1.5" style={{ transition: 'var(--transition-smooth)' }} />
            <text textAnchor="middle" y="1" fill="white" fontSize="9" fontWeight="bold">Kafka Broker</text>
            <text textAnchor="middle" y="11" fill="var(--color-cyan)" fontSize="7" fontFamily="var(--font-mono)">Port 9092</text>
          </g>
        </svg>
      </div>
    </div>
  );
}
