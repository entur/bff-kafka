// Only handlers where we don't want to handle all elements use the whitelist
const whitelistedEvents = [
    'PaymentTransactionCaptured',
    'PaymentTransactionCancelled',
    'PaymentTransactionRejected',
    'TicketDistributionAdded',
    'TicketDistributionCancelled',
    'TicketDistributionCancelledExternally',
]

export default whitelistedEvents
