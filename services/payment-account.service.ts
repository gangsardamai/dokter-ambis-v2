import { paymentAccountRepository } from "@/repositories/payment-account.repository";

export interface PaymentAccountInput {
  label: string;
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  isActive: boolean;
}

function normalize(input: PaymentAccountInput) {
  const label = input.label.trim();
  const bankName = input.bankName.trim();
  const accountNumber = input.accountNumber.replace(/\s+/g, "").trim();
  const accountHolderName = input.accountHolderName.trim();

  if (!label || !bankName || !accountNumber || !accountHolderName) {
    throw new Error("Label, bank, nomor rekening, dan nama pemilik wajib diisi.");
  }

  return {
    label,
    bank_name: bankName,
    account_number: accountNumber,
    account_holder_name: accountHolderName,
    is_active: input.isActive,
  };
}

export class PaymentAccountService {
  async getAccounts() {
    const [accounts, usageCounts] = await Promise.all([
      paymentAccountRepository.getAll(),
      paymentAccountRepository.getCourseUsageCounts(),
    ]);

    return accounts.map((account) => ({
      ...account,
      courseCount: usageCounts[account.id] ?? 0,
    }));
  }

  async getActiveAccounts() {
    return paymentAccountRepository.getActive();
  }

  async getAccountById(id: string) {
    return paymentAccountRepository.getById(id);
  }

  async getAccountForCourse(courseId: string) {
    return paymentAccountRepository.getForCourse(courseId);
  }

  async requireActiveAccount(id: string): Promise<void> {
    if (!id) throw new Error("Rekening pembayaran wajib dipilih.");
    const account = await paymentAccountRepository.getById(id);
    if (!account || !account.is_active) {
      throw new Error("Rekening pembayaran tidak aktif atau tidak ditemukan.");
    }
  }

  async createAccount(input: PaymentAccountInput) {
    return paymentAccountRepository.create(normalize(input));
  }

  async updateAccount(id: string, input: PaymentAccountInput) {
    const existing = await paymentAccountRepository.getById(id);
    if (!existing) throw new Error("Rekening pembayaran tidak ditemukan.");
    if (existing.is_default && !input.isActive) {
      throw new Error("Rekening default tidak dapat dinonaktifkan.");
    }
    return paymentAccountRepository.update(id, normalize(input));
  }

  async setDefaultAccount(id: string) {
    return paymentAccountRepository.setDefault(id);
  }
}

export const paymentAccountService = new PaymentAccountService();
