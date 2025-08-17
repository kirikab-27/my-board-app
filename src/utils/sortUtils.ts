import { SortOption } from '@/components/SortSelector';

/**
 * SortOptionをAPIのsortByとsortOrderパラメーターに変換
 */
export function convertSortOption(sortOption: SortOption): { sortBy: string; sortOrder: string } {
  const [field, order] = sortOption.split('_');
  return {
    sortBy: field,
    sortOrder: order
  };
}

/**
 * APIのsortByとsortOrderパラメーターをSortOptionに変換
 */
export function convertToSortOption(sortBy: string, sortOrder: string): SortOption {
  return `${sortBy}_${sortOrder}` as SortOption;
}