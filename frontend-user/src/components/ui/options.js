import { LayoutGrid, List } from 'lucide-react';

/** Options for <Segmented> on list pages that offer a table and a card grid. */
export const TABLE_GRID_OPTIONS = [
  { value: 'table', label: 'Bảng', icon: List },
  { value: 'grid', label: 'Lưới', icon: LayoutGrid },
];

/** Options for <Segmented> on list pages that offer a row card list and a card grid. */
export const LIST_GRID_OPTIONS = [
  { value: 'list', label: 'Danh sách', icon: List },
  { value: 'grid', label: 'Lưới', icon: LayoutGrid },
];
