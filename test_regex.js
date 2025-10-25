// Test regex replacement for template variables
const subject = 'Welcome to {{ church_name }}!';
const body = 'Dear {{ first_name }},\n\nWelcome to our church family! We are excited to have you join us.\n\nBlessings,\n{{ church_name }} Team';

const templateVariables = {
  church_name: 'Demonstration of Christ Ministries',
  first_name: 'Direct'
};

console.log('Original subject:', subject);
console.log('Original body:', body);
console.log('');

let processedSubject = subject;
let processedBody = body;

Object.entries(templateVariables).forEach(([key, value]) => {
  const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
  console.log(`Testing regex for ${key}:`, regex);
  
  const beforeSubject = processedSubject;
  const beforeBody = processedBody;
  
  processedSubject = processedSubject.replace(regex, String(value));
  processedBody = processedBody.replace(regex, String(value));
  
  console.log(`${key} replacement:`);
  console.log(`  Subject: "${beforeSubject}" -> "${processedSubject}"`);
  console.log(`  Body changed: ${beforeBody !== processedBody}`);
  console.log('');
});

console.log('Final results:');
console.log('Subject:', processedSubject);
console.log('Body:', processedBody); 