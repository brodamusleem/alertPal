insert into public.transactions
  (ref, amount, sender, recipient, bank, status, timestamp, channel)
values
  (
    'OP2026061108731',
    15000,
    'Emeka Johnson',
    'Mama Titi Store',
    'OPay Wallet',
    'settled',
    '2026-06-11T09:11:08Z',
    'wallet_transfer'
  ),
  (
    'OP2026061094421',
    45000,
    'Adebayo Okafor',
    'Kunle Electronics',
    'OPay Wallet',
    'settled',
    '2026-06-11T08:44:21Z',
    'wallet_transfer'
  ),
  (
    'OP2026061072983',
    8500,
    'Fatima Aliyu',
    'Iya Basira Food',
    'OPay Wallet',
    'settled',
    '2026-06-11T07:29:33Z',
    'wallet_transfer'
  ),
  (
    'OP2026061031122',
    120000,
    'Chukwuemeka Nweze',
    'Bello Auto Parts',
    'OPay Wallet',
    'settled',
    '2026-06-11T03:11:55Z',
    'wallet_transfer'
  ),
  (
    'GT2026061055893',
    32500,
    'Ngozi Obi',
    'Mama Titi Store',
    'GTBank',
    'settled',
    '2026-06-11T05:58:43Z',
    'nip_transfer'
  )
on conflict (ref) do update set
  amount = excluded.amount,
  sender = excluded.sender,
  recipient = excluded.recipient,
  bank = excluded.bank,
  status = excluded.status,
  timestamp = excluded.timestamp,
  channel = excluded.channel;
