import {
  BookOpen, ClipboardList, CreditCard, DollarSign, FileText, History, LayoutDashboard,
  ShoppingCart, UserCog, UserRound, Users, type LucideIcon,
} from 'lucide-react';
import type { GuideIcon } from '@/lib/help-content';

export const GUIDE_ICONS: Record<GuideIcon, LucideIcon> = {
  dashboard: LayoutDashboard,
  spp: CreditCard,
  payroll: Users,
  expenses: DollarSign,
  procurement: ShoppingCart,
  accounting: BookOpen,
  reports: FileText,
  logs: History,
  students: UserRound,
  employees: ClipboardList,
  access: UserCog,
};
