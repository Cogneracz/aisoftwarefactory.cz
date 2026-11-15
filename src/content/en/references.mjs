/** The systems built in the factory, in English: cognera.cz's own English lines for its case studies (../references.mjs). */
export const REFERENCES_EN = {
  builtWith: "Built with",
  note: "We built each of these systems with AI agents, overseen by senior engineers. The screens show invented demo data, and we never publish real client data.",
  items: [
    {
      slug: "centera",
      name: "Centera",
      field: "Proptech · ERP",
      line: "The operations system for shopping center owners and managers. It replaced a legacy application and is live in production.",
      alt: "Centera: an overview of shopping centers with their occupancy and invoicing status.",
    },
    { slug: "helpdesk", name: "Cognera Helpdesk", field: "Support", line: "Customer reports, straight to the developer.", alt: "The ticket queue in the Cognera Helpdesk console, each ticket with its type, status, and priority." },
    { slug: "cognera-crm", name: "Cognera CRM", field: "Internal system", line: "Our timesheets and invoicing run on it.", alt: "The approval inbox in Cognera CRM: timesheets waiting for the owner to review them." },
    { slug: "invoiceai", name: "InvoiceAI", field: "Accounting", line: "AI extracts the data from incoming invoices, and the accountant has the final say.", alt: "An overview of invoices by status, each with its extraction accuracy." },
  ],
};
