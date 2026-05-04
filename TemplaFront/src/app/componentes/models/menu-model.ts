export interface MenuSubmenuItem {
  label: string;
  route: string;
}

export interface MenuItem {
  id: string;
  icon: string;
  label: string;
  route: string;
  hasSubmenu: boolean;
  submenu?: MenuSubmenuItem[];
  isPrincipal?: boolean;
}

export interface SubMenuItem {
  label: string;
  route: string;
}

// Nueva interface para la data del routing
export interface RouteMenuData {
  showInMenu?: boolean;
  menuLabel?: string;
  icon?: string;
  parentMenu?: string;
  order?: number;
  isPrincipal?: boolean;
  hasSubmenu?: boolean;
}