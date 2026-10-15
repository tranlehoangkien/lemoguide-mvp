import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { cx } from './cx';

/** Shared detail navigation; accepts React Router Link props, including state. */
export const DetailLink = ({ className, ...props }) => (
  <Link className={cx('ui-btn ui-btn--secondary ui-btn--sm ui-btn--has-trail', className)} {...props}>
    <span>Chi tiết</span>
    <span className="ui-btn__trail"><ArrowRight size={14} aria-hidden="true" /></span>
  </Link>
);
