export interface ExpenseCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  bgColor: string;
}

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  {
    id: 'groceries',
    name: 'Groceries',
    icon: 'fas fa-shopping-cart',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100'
  },
  {
    id: 'transport',
    name: 'Transport',
    icon: 'fas fa-gas-pump',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100'
  },
  {
    id: 'food',
    name: 'Food & Dining',
    icon: 'fas fa-utensils',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100'
  },
  {
    id: 'healthcare',
    name: 'Healthcare',
    icon: 'fas fa-pills',
    color: 'text-green-600',
    bgColor: 'bg-green-100'
  },
  {
    id: 'utilities',
    name: 'Utilities',
    icon: 'fas fa-bolt',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100'
  },
  {
    id: 'entertainment',
    name: 'Entertainment',
    icon: 'fas fa-film',
    color: 'text-pink-600',
    bgColor: 'bg-pink-100'
  },
  {
    id: 'education',
    name: 'Education',
    icon: 'fas fa-graduation-cap',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100'
  },
  {
    id: 'other',
    name: 'Other',
    icon: 'fas fa-tag',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100'
  }
];

export function getCategoryById(id: string): ExpenseCategory | undefined {
  return EXPENSE_CATEGORIES.find(category => category.id === id);
}

export function getCategoryIcon(categoryId: string): string {
  const category = getCategoryById(categoryId);
  return category?.icon || 'fas fa-tag';
}

export function getCategoryColors(categoryId: string): { color: string; bgColor: string } {
  const category = getCategoryById(categoryId);
  return {
    color: category?.color || 'text-gray-600',
    bgColor: category?.bgColor || 'bg-gray-100'
  };
}
