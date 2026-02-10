
import { useUiStore } from '../../stores/uiStore';
import Modal from '../ui/Modal';
import { TERMS_DATA, PRIVACY_POLICY_DATA } from './TermsData';

export default function TermsModal() {
    const isOpen = useUiStore((state) => state.termsModalOpen);
    const onClose = useUiStore((state) => state.closeTermsModal);

    return (
        <Modal open={isOpen} onClose={onClose} title="서비스 이용약관 및 개인정보처리방침">
            <div className="space-y-8">
                {/* Terms of Service Section */}
                <section>
                    <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                        IPSL 동문회 포털 이용약관
                    </h2>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6">시행일: 2026년 2월 1일</p>

                    <div className="space-y-6">
                        {TERMS_DATA.map((section, index) => (
                            <div key={`terms-${index}`}>
                                <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mb-2">
                                    {section.title}
                                </h3>
                                <ul className="space-y-1">
                                    {section.content.map((text, i) => (
                                        <li key={i} className="text-xs text-zinc-600 dark:text-zinc-400 list-none leading-relaxed">
                                            {text}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </section>

                <hr className="border-zinc-200 dark:border-zinc-700" />

                {/* Privacy Policy Section */}
                <section>
                    <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                        개인정보처리방침
                    </h2>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6">시행일: 2026년 2월 1일</p>

                    <div className="space-y-6">
                        {PRIVACY_POLICY_DATA.map((section, index) => (
                            <div key={`privacy-${index}`}>
                                <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mb-2">
                                    {section.title}
                                </h3>
                                <ul className="space-y-1">
                                    {section.content.map((text, i) => (
                                        <li key={i} className="text-xs text-zinc-600 dark:text-zinc-400 list-none leading-relaxed">
                                            {text}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </section>

                <div className="pt-4 mt-8 border-t border-zinc-100 dark:border-zinc-700">
                    <button
                        onClick={onClose}
                        className="w-full py-3 rounded-xl text-sm font-bold bg-navy-600 text-white hover:bg-navy-700 transition-colors"
                    >
                        확인
                    </button>
                </div>
            </div>
        </Modal>
    );
}
