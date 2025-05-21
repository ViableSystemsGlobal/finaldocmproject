import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

// Create directory if it doesn't exist
const templateDir = path.join(process.cwd(), 'public', 'templates');
if (!fs.existsSync(templateDir)) {
  fs.mkdirSync(templateDir, { recursive: true });
}

// Sample data for contacts template
const contactSampleData = [
  {
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
    phone: '(555) 123-4567',
    lifecycle: 'lead'
  },
  {
    first_name: 'Jane',
    last_name: 'Smith',
    email: 'jane.smith@example.com',
    phone: '(555) 987-6543',
    lifecycle: 'member'
  }
];

// Create contacts template
const contactsWorkbook = XLSX.utils.book_new();
const contactsWorksheet = XLSX.utils.json_to_sheet(contactSampleData);

// Add headers
XLSX.utils.sheet_add_aoa(contactsWorksheet, [
  ['first_name', 'last_name', 'email', 'phone', 'lifecycle']
], { origin: 'A1' });

// Set column widths
const contactsCols = [
  { wch: 15 }, // first_name
  { wch: 15 }, // last_name
  { wch: 25 }, // email
  { wch: 15 }, // phone
  { wch: 10 }, // lifecycle
];
contactsWorksheet['!cols'] = contactsCols;

XLSX.utils.book_append_sheet(contactsWorkbook, contactsWorksheet, 'Contacts');

// Write contacts template
const contactsTemplatePath = path.join(templateDir, 'contacts_template.xlsx');
XLSX.writeFile(contactsWorkbook, contactsTemplatePath);

console.log(`Template generated: ${contactsTemplatePath}`); 