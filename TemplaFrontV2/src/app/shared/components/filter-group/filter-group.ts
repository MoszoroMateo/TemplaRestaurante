import { Component, input, output, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface FilterOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-filter-group',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './filter-group.html',
})
export class FilterGroupComponent {
  /** Radio button options */
  options = input.required<FilterOption[]>();
  /** Name attribute for the radio group (for correctness when multiple groups exist on page) */
  name = input('filter');
  /** Currently selected value (two-way binding) */
  selected = model<string>('');

  /** Emits when selection changes (same as selected model change) */
  selectionChange = output<string>();
}
