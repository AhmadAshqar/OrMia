import fs from 'fs';

// Read the file
const filePath = 'client/src/pages/MyOrdersPage.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Replace the button pattern with our OrderContactButton component
const buttonPattern = /<Button variant="ghost" size="sm" asChild>\s*<Link href={\`\/support\/order\/\${order\.id}\`} className="flex items-center">\s*צור קשר בנוגע להזמנה\s*<ChevronRight className="ml-1 h-4 w-4" \/>\s*<\/Link>\s*<\/Button>/g;
const replacement = '<OrderContactButton orderId={order.id} />';

// Perform the replacement
const updatedContent = content.replace(buttonPattern, replacement);

// Write the file back
fs.writeFileSync(filePath, updatedContent, 'utf8');

console.log('File updated successfully');
