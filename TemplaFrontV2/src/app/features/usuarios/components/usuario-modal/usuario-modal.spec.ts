import { TestBed } from '@angular/core/testing';
import { UsuarioModalComponent } from './usuario-modal';
import { RolUsuario, UsuarioDTO } from '../../models/usuario.model';

describe('UsuarioModalComponent', () => {
  const mockPersonas = [
    { dni: 43998130, nombre: 'Mateo Moszoro' },
    { dni: 12345678, nombre: 'Ana Lopez' },
  ];

  function createComponent(
    isEditMode = false,
    usuarioData?: UsuarioDTO,
    personas = mockPersonas,
  ): { component: UsuarioModalComponent; fixture: any } {
    const fixture = TestBed.createComponent(UsuarioModalComponent);
    const component = fixture.componentInstance;

    // Set inputs
    (fixture.componentInstance as any).isEditMode = isEditMode;
    (fixture.componentInstance as any).usuarioData = usuarioData;
    (fixture.componentInstance as any).personas = personas;
    fixture.detectChanges();

    return { component, fixture };
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsuarioModalComponent],
    }).compileComponents();
  });

  // ── Form initialization ──

  it('should create the form with required controls', () => {
    const { component } = createComponent();
    expect((component as any).form.contains('username')).toBe(true);
    expect((component as any).form.contains('password')).toBe(true);
    expect((component as any).form.contains('rol')).toBe(true);
    expect((component as any).form.contains('personaDni')).toBe(true);
  });

  it('should require username and rol always', () => {
    const { component } = createComponent();
    const usernameCtrl = (component as any).form.get('username');
    usernameCtrl?.setValue('');
    expect(usernameCtrl?.valid).toBe(false);

    usernameCtrl?.setValue('admin');
    expect(usernameCtrl?.valid).toBe(true);

    const rolCtrl = (component as any).form.get('rol');
    expect(rolCtrl?.valid).toBe(false); // rol is required
  });

  // ── Password required on create, optional on edit ──

  it('should require password on create mode', () => {
    const { component } = createComponent(false); // create mode
    const passwordCtrl = (component as any).form.get('password');
    passwordCtrl?.setValue('');
    expect(passwordCtrl?.valid).toBe(false);

    passwordCtrl?.setValue('pass123');
    expect(passwordCtrl?.valid).toBe(true);
  });

  it('should not require password on edit mode', () => {
    const userData: UsuarioDTO = {
      id: 1, username: 'admin', rolUsuario: RolUsuario.ADMINISTRADOR,
      activo: true, personaNombre: 'Admin',
    };
    const { component } = createComponent(true, userData);
    const passwordCtrl = (component as any).form.get('password');
    expect(passwordCtrl?.valid).toBe(true); // empty is valid in edit mode
  });

  it('should patch form values in edit mode', () => {
    const userData: UsuarioDTO = {
      id: 1, username: 'admin', rolUsuario: RolUsuario.ADMINISTRADOR,
      activo: true, personaNombre: 'Admin',
    };
    const { component } = createComponent(true, userData);

    expect((component as any).form.get('username')?.value).toBe('admin');
    expect((component as any).form.get('rol')?.value).toBe(RolUsuario.ADMINISTRADOR);
  });

  // ── Submit ──

  it('should emit save with UsuarioCreateDTO on create submit', () => {
    const { component } = createComponent();
    let emitted: any = null;
    component.save.subscribe(e => emitted = e);

    (component as any).form.patchValue({
      username: 'newuser',
      password: 'pass123',
      rol: RolUsuario.MOZO,
      personaDni: 43998130,
    });

    (component as any).onSubmit();

    expect(emitted).toBeTruthy();
    expect(emitted.username).toBe('newuser');
    expect(emitted.password).toBe('pass123');
    expect(emitted.rolUsuario).toBe(RolUsuario.MOZO);
    expect(emitted.personaDni).toBe(43998130);
  });

  it('should emit save with UsuarioUpdateDTO on edit submit', () => {
    const userData: UsuarioDTO = {
      id: 1, username: 'admin', rolUsuario: RolUsuario.ADMINISTRADOR,
      activo: true, personaNombre: 'Admin',
    };
    const { component } = createComponent(true, userData);
    let emitted: any = null;
    component.save.subscribe(e => emitted = e);

    (component as any).form.patchValue({
      username: 'admin-updated',
      rol: RolUsuario.ENCARGADO,
    });

    (component as any).onSubmit();

    expect(emitted).toBeTruthy();
    expect(emitted.username).toBe('admin-updated');
    expect(emitted.rolUsuario).toBe(RolUsuario.ENCARGADO);
    expect(emitted.activo).toBe(true);
    expect(emitted.password).toBeUndefined(); // no password sent when empty
  });

  it('should NOT emit save when form is invalid', () => {
    const { component } = createComponent();
    let emitted = false;
    component.save.subscribe(() => emitted = true);

    (component as any).onSubmit(); // form is empty/invalid
    expect(emitted).toBe(false);
  });

  // ── Cancel ──

  it('should emit cancel when onCancel is called', () => {
    const { component } = createComponent();
    let emitted = false;
    component.cancel.subscribe(() => emitted = true);

    (component as any).onCancel();
    expect(emitted).toBe(true);
  });

  // ── Persona dropdown ──

  it('should receive personas input for dropdown', () => {
    const { component } = createComponent();
    expect(component.personas().length).toBe(2);
    expect(component.personas()[0].nombre).toBe('Mateo Moszoro');
  });
});
