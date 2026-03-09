import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { useAlert } from '../../context/AlertContext';

const SiteAlertModal = () => {
    const { alert, hideAlert } = useAlert();

    if (!alert.isOpen) return null;

    const getIcon = () => {
        switch (alert.type) {
            case 'success': return <CheckCircle2 className="w-12 h-12 text-green-500" />;
            case 'error': return <AlertCircle className="w-12 h-12 text-red-500" />;
            case 'warning': return <AlertTriangle className="w-12 h-12 text-amber-500" />;
            default: return <Info className="w-12 h-12 text-blue-500" />;
        }
    };

    const handleConfirm = () => {
        if (alert.onConfirm) alert.onConfirm();
        hideAlert();
    };

    const handleCancel = () => {
        if (alert.onCancel) alert.onCancel();
        hideAlert();
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl"
                >
                    <div className="p-8 flex flex-col items-center text-center">
                        <div className="mb-6 bg-white/5 p-4 rounded-full">
                            {getIcon()}
                        </div>

                        {alert.title && (
                            <h3 className="text-xl font-serif text-white mb-2">{alert.title}</h3>
                        )}

                        <p className="text-zinc-400 font-light leading-relaxed">
                            {alert.message}
                        </p>
                    </div>

                    <div className="flex border-t border-white/10">
                        {alert.showCancel && (
                            <button
                                onClick={handleCancel}
                                className="flex-1 py-4 text-zinc-400 font-medium transition-colors border-r border-white/10"
                            >
                                {alert.cancelText}
                            </button>
                        )}
                        <button
                            onClick={handleConfirm}
                            className={`flex-1 py-4 font-bold transition-colors ${alert.type === 'error' ? 'text-red-500 hover:bg-red-500/10' :
                                    alert.type === 'success' ? 'text-green-500 hover:bg-green-500/10' :
                                        'text-amber-500'
                                }`}
                        >
                            {alert.confirmText}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default SiteAlertModal;
