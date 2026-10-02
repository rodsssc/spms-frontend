import { useEffect, useRef } from "react";

type ManagementModalProps = {
    open: boolean;
    title: string;
    description: string;
    onClose: () => void;
    children: React.ReactNode;
};

export default function ManagementModal({ open, title, description, onClose, children }: ManagementModalProps) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        if (open && !dialog.open) dialog.showModal();
        if (!open && dialog.open) dialog.close();
    }, [open]);

    return <dialog ref={dialogRef} className="modal" onClose={onClose}>
        <div className="modal-box w-11/12 max-w-3xl rounded-xl border-t-4 border-emerald-800 bg-white shadow-xl">
            <div className="flex items-start justify-between gap-4"><div><h3 className="text-lg font-bold text-slate-800">{title}</h3><p className="mt-1 text-xs text-slate-500">{description}</p></div><button type="button" className="btn btn-circle btn-ghost btn-sm" onClick={() => dialogRef.current?.close()}><i className="fa-solid fa-xmark"/></button></div>
            {children}
        </div>
        <form method="dialog" className="modal-backdrop"><button>close</button></form>
    </dialog>;
}
