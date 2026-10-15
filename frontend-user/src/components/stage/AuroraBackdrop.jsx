import './AiStage.css';

/** Glowing orbs drifting left to right behind an `.ui-aistage`. Purely decorative. */
const AuroraBackdrop = () => (
  <div className="ui-aurora" aria-hidden="true">
    <div className="ui-aurora__orb ui-aurora__orb--emerald" />
    <div className="ui-aurora__orb ui-aurora__orb--teal" />
    <div className="ui-aurora__orb ui-aurora__orb--cyan" />
    <div className="ui-aurora__orb ui-aurora__orb--indigo" />
    <div className="ui-aurora__orb ui-aurora__orb--violet" />
    <div className="ui-aurora__sweep" />
    <div className="ui-aurora__grid" />
    <div className="ui-aurora__shade" />
  </div>
);

export default AuroraBackdrop;
