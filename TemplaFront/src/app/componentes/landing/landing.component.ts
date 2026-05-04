import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

// Interfaces para tipar los datos (simulando respuesta del backend)
interface MenuItem {
  nombre: string;
}

interface MenuSection {
  titulo: string;
  items: MenuItem[];
}

interface MenuCompleto {
  horario: string;
  secciones: MenuSection[];
  precio?: string;
  nota?: string;
}

interface Experiencia {
  titulo: string;
  descripcion: string;
  nota?: string;
}

interface ContactoInfo {
  telefono: string;
  email: string;
  instagram: string;
  horarios: string[];
  direccion: string[];
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css'
})
export class LandingComponent implements OnInit {
  isScrolled = false;
  isMobileMenuOpen = false;
  activeModal: string | null = null;
  activeExperienciaModal: string | null = null;
  activeSection: string = 'hero';
  
  // Carousel
  currentSlide = 0;
  carouselImages: string[] = [
    'assets/imagenes/contactCarr1.png',
    'assets/imagenes/contactCarr2.png',
    'assets/imagenes/contactCarr3.png',
  ];

  // Imágenes de los botones del menú
  menuEjecutivoImage: string = 'assets/imagenes/menuEjecutivo.png';
  cartaCenaImage: string = 'assets/imagenes/cartaCena.png';
  cartaVinosImage: string = 'assets/imagenes/vino.png';

  // Imagen del Museo
  museoImage: string = 'assets/imagenes/museo.png';

  // Imagen del Salón VIP
  salonVipImage: string = 'assets/imagenes/salonVip.png';

  // Datos simulados del backend - En el futuro estos vendrían de un servicio
  sobreNosotros = {
    titulo: 'OFRECEMOS UNA EXPERIENCIA ÚNICA, EN DONDE CÓRDOBA ESTÁ PRESENTE EN CADA SABOR',
    parrafos: [
      'LE INVITAMOS A DESCUBRIR UNA COCINA DISEÑADA PARA QUE PUEDA DISFRUTAR DE PLATOS CREADOS A PARTIR DE LOS MEJORES PRODUCTOS DE NUESTRA PROVINCIA',
      'TRABAJAMOS JUNTO CON PRODUCTORES CORDOBESES, GARANTIZANDO QUE CADA INGREDIENTE QUE LLEGA A SU MESA SEA FRESCO, EXCEPCIONAL Y REPRESENTATIVO DE LA RIQUEZA LOCAL',
      'NOS DEDICAMOS A TRANSFORMAR CADA VISITA EN UNA EXPERIENCIA MEMORABLE'
    ]
  };

  menuEjecutivo: MenuCompleto = {
    horario: 'HORARIO DE SERVICIO | 12:30 A 15:30HS\nLUNES A VIERNES',
    secciones: [
      {
        titulo: 'ENTRADAS',
        items: [
          { nombre: '1. SALMOREJO' },
          { nombre: '2. SELECCIÓN DE CURADOS' },
          { nombre: '3. MOLLEJAS DE CABRITO' }
        ]
      },
      {
        titulo: 'PLATOS PRINCIPALES:',
        items: [
          { nombre: '1. RISOTTO DE CALABAZA' },
          { nombre: '2. OJO DE BIFE CON VEGETALES DE ESTACIÓN' },
          { nombre: '3. CORDERO CON SALSA DE FRUTOS ROJOS Y ENSALADA DE QUINOA' }
        ]
      },
      {
        titulo: 'POSTRES:',
        items: [
          { nombre: '1. MILHOJAS DE MANZANA' },
          { nombre: '2. SEMIFREDDO DE CHOCOLATE Y MANÍ' },
          { nombre: '3. INFUSIÓN A ELECCIÓN' }
        ]
      }
    ],
    precio: '$30.000',
    nota: '(INCLUYE UNA OPCIÓN DE CADA PASO)'
  };

  cartaCena: MenuCompleto = {
    horario: 'HORARIO DE SERVICIO | 20:30 A 00:30HS\nMARTES A SÁBADO',
    secciones: [
      {
        titulo: 'ENTRADAS',
        items: [
          { nombre: 'CARPACCIO DE LOMO CON PARMESANO - $12.500' },
          { nombre: 'PROVOLETA AL OREGANATO - $9.800' },
          { nombre: 'TABLA DE FIAMBRES Y QUESOS ARTESANALES - $18.000' }
        ]
      },
      {
        titulo: 'PLATOS PRINCIPALES',
        items: [
          { nombre: 'BIFE DE CHORIZO (400GR) CON GUARNICIÓN - $24.500' },
          { nombre: 'CORDERO PATAGÓNICO CON PURÉ DE CALABAZA - $28.000' },
          { nombre: 'RAVIOLES DE RICOTA Y ESPINACA - $19.500' }
        ]
      },
      {
        titulo: 'POSTRES',
        items: [
          { nombre: 'MOUSSE DE CHOCOLATE AMARGO - $8.000' },
          { nombre: 'PANQUEQUE CON FRUTOS ROJOS - $8.500' }
        ]
      }
    ],
    nota: 'TODOS LOS PLATOS SE PREPARAN CON PRODUCTOS LOCALES DE CÓRDOBA'
  };

  cartaVinos: MenuCompleto = {
    horario: 'CARTA DE VINOS',
    secciones: [
      {
        titulo: 'VINOS TINTOS',
        items: [
          { nombre: 'MALBEC RESERVA - MENDOZA - $15.000' },
          { nombre: 'CABERNET SAUVIGNON - VALLE DE UCO - $18.000' },
          { nombre: 'BLEND TINTO PREMIUM - $22.000' },
          { nombre: 'MALBEC GRAN RESERVA - $28.000' }
        ]
      },
      {
        titulo: 'VINOS BLANCOS',
        items: [
          { nombre: 'TORRONTÉS - SALTA - $12.500' },
          { nombre: 'CHARDONNAY - MENDOZA - $14.000' },
          { nombre: 'SAUVIGNON BLANC - PATAGONIA - $16.000' }
        ]
      },
      {
        titulo: 'VINOS ROSADOS',
        items: [
          { nombre: 'ROSÉ DE MALBEC - $13.000' },
          { nombre: 'ROSÉ PREMIUM - $15.500' }
        ]
      },
      {
        titulo: 'ESPUMANTES',
        items: [
          { nombre: 'EXTRA BRUT - MENDOZA - $16.000' },
          { nombre: 'BLANC DE BLANCS - $19.000' },
          { nombre: 'ROSÉ ESPUMANTE - $18.000' }
        ]
      }
    ],
    nota: 'CONSULTE POR NUESTRA SELECCIÓN DE VINOS POR COPA'
  };

  // Experiencias individuales con tipado específico (no index signature)
  experienciasSalon: Experiencia = {
    titulo: 'SALÓN VIP',
    descripcion: 'EXPERIENCIA GASTRONÓMICA EXCLUSIVA EN UN AMBIENTE PRIVADO Y SOFISTICADO. CAPACIDAD PARA 20 COMENSALES CON SERVICIO PERSONALIZADO, MENÚ DEGUSTACIÓN Y MARIDAJE PREMIUM. IDEAL PARA CELEBRACIONES ESPECIALES Y CENAS DE NEGOCIOS.'
  };

  experienciasDegustacion: Experiencia = {
    titulo: 'MENÚ DEGUSTACIÓN',
    descripcion: 'PROPUESTA GASTRONÓMICA ÚNICA QUE DESTACA LOS INGREDIENTES PROTAGONISTAS DE CADA TEMPORADA. RENOVAMOS NUESTRO MENÚ DEGUSTACIÓN ESTACIONALMENTE PARA PRESENTAR LOS PRODUCTOS QUE LUEGO FORMARÁN PARTE DE NUESTRA CARTA HABITUAL. UNA EXPERIENCIA CULINARIA QUE ANTICIPA LOS SABORES DE LA PRÓXIMA TEMPORADA.'
  };

  experienciasMuseo: Experiencia = {
    titulo: 'MUSEO REGIONAL CORDOBÉS',
    descripcion: 'DURANTE EL SERVICIO DE LA CENA, NUESTROS COMENSALES PODRÁN DISFRUTAR DE UN RECORRIDO POR NUESTRO MUSEO, UN ESPACIO DIRIGIDO A LOS PRODUCTORES Y ARTESANOS QUE FORMAN PARTE DE LA PROPUESTA GASTRONÓMICA Y ESTÉTICA DE TEMPLA',
    nota: 'VISITA GUIADA DISPONIBLE DURANTE EL HORARIO DE CENA'
  };

  experienciasEventos: Experiencia = {
    titulo: 'EVENTOS',
    descripcion: 'ORGANIZAMOS EVENTOS CORPORATIVOS Y CELEBRACIONES PERSONALES CON SERVICIO PERSONALIZADO. OFRECEMOS ALMUERZOS Y CENAS DE NEGOCIOS, CUMPLEAÑOS EXCLUSIVOS Y EVENTOS VIP CON MENÚ A MEDIDA, DECORACIÓN ESPECIALIZADA Y ATENCIÓN DEDICADA. CADA EVENTO ES DISEÑADO SEGÚN SUS NECESIDADES Y PREFERENCIAS.'
  };

  contacto: ContactoInfo = {
    telefono: '+54 351 6 894612',
    email: 'TEMPLARESTAURANTE@GMAIL.COM',
    instagram: '@TEMPLARESTO',
    horarios: [
      'HORARIOS DE ATENCIÓN:',
      'LUN: 12:30-15:30',
      'MAR-VIE: 12:30-15:30 / 20:30-00:30',
      'SAB: 20:30-00:30'
    ],
    direccion: [
      'Gdor. Felix Garzon 2046 Córdoba',
      'Córdoba, Argentina'
    ]
  };

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Inicialización del componente
    this.updateActiveSection();
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled = window.pageYOffset > 50;
    this.updateActiveSection();
  }

  // Actualizar sección activa basada en scroll
  updateActiveSection(): void {
    const sections = ['hero', 'aboutUs', 'menu', 'experiencias', 'contact'];
    const scrollPosition = window.pageYOffset + 200; // Offset para activación temprana

    for (const sectionId of sections) {
      const element = document.getElementById(sectionId);
      if (element) {
        const offsetTop = element.offsetTop;
        const offsetBottom = offsetTop + element.offsetHeight;

        if (scrollPosition >= offsetTop && scrollPosition < offsetBottom) {
          this.activeSection = sectionId;
          break;
        }
      }
    }
  }

  // Scroll suave a una sección específica
  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      const navbarHeight = 70; // Altura del navbar
      const elementPosition = element.offsetTop - navbarHeight;
      
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
      });
      
      // Cerrar menú móvil si está abierto
      this.isMobileMenuOpen = false;
    }
  }

  // Toggle menú móvil
  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  // Abrir modal de menú
  openMenuModal(type: string): void {
    this.activeModal = type;
    document.body.style.overflow = 'hidden'; // Prevenir scroll
  }

  // Cerrar modal de menú
  closeMenuModal(): void {
    this.activeModal = null;
    document.body.style.overflow = 'auto'; // Restaurar scroll
  }

  // Abrir modal de experiencia
  openExperienciaModal(type: string): void {
    this.activeExperienciaModal = type;
    document.body.style.overflow = 'hidden';
  }

  // Cerrar modal de experiencia
  closeExperienciaModal(): void {
    this.activeExperienciaModal = null;
    document.body.style.overflow = 'auto';
  }

  // Carousel - Slide anterior
  prevSlide(): void {
    this.currentSlide = (this.currentSlide - 1 + this.carouselImages.length) % this.carouselImages.length;
  }

  // Carousel - Slide siguiente
  nextSlide(): void {
    this.currentSlide = (this.currentSlide + 1) % this.carouselImages.length;
  }

  // Navegar al login
  irAlLogin(): void {
    this.router.navigate(['/login']);
  }

  // Navegar a reservas (si es accesible sin login)
  irAReservas(): void {
    this.router.navigate(['/nueva-reserva']);
  }

  // Ver el menú
  verMenu(): void {
    this.router.navigate(['/menu']);
  }
}
