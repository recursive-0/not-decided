import { AlertTriangle, X, CheckCircle, Info, AlertCircle, Loader2 } from "lucide-react";
import { toast as SonnerToast } from "sonner"

type ToastTypes = 'normal' | 'action' | 'success' | 'info' | 'warning' | 'error' | 'loading' | 'default';

export function toast(props: {title: string, description: string, variant: ToastTypes }) {
    const { title, description, variant } = props

    return SonnerToast.custom((id) => {
        const toastProps = {
            id: id,
            description: description,
            title: title,
        }
        
        switch(variant) {
            case "warning":
                return <WarningToast {...toastProps} />
            case "success":
                return <SuccessToast {...toastProps} />
            case "error":
                return <ErrorToast {...toastProps} />
            case "info":
                return <InfoToast {...toastProps} />
            case "loading":
                return <LoadingToast {...toastProps} />
            case "default":
            case "normal":
            default:
                return <DefaultToast {...toastProps} />
        }
    })
}

interface ToastProps {
    description: string,
    title: string,
    id: number | string
}

export const WarningToast: React.FC<ToastProps> = (props) => {
    const { title, id, description } = props
    return (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-3 shadow-md text-sm flex items-start">
          <AlertTriangle className="text-amber-500 h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-amber-800 font-medium">{title}</p>
            <p className="text-amber-700 text-xs mt-1">
              {description}
            </p>
            <div className="mt-2 flex gap-2">
              <button 
                onClick={() => SonnerToast.dismiss(id)}
                className="px-2 py-1 text-xs bg-amber-100 hover:bg-amber-200 text-amber-700 rounded"
              >
                Dismiss
              </button>
            </div>
          </div>
          <button 
            onClick={() => SonnerToast.dismiss(id)}
            className="text-amber-500 hover:text-amber-700 ml-2"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
    )
}

export const SuccessToast: React.FC<ToastProps> = (props) => {
    const { title, id, description } = props
    return (
        <div className="bg-[#edf7ed] border border-[#c6e6c6] rounded-md p-3 shadow-md text-sm flex items-start">
          <CheckCircle className="text-[var(--color-olive-green)] h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-[var(--color-forest-teal)] font-medium">{title}</p>
            <p className="text-[var(--color-olive-green)] text-xs mt-1">
              {description}
            </p>
            <div className="mt-2 flex gap-2">
              <button 
                onClick={() => SonnerToast.dismiss(id)}
                className="px-2 py-1 text-xs bg-[#ddf0dd] hover:bg-[#c6e6c6] text-[var(--color-olive-green)] rounded"
              >
                Dismiss
              </button>
            </div>
          </div>
          <button 
            onClick={() => SonnerToast.dismiss(id)}
            className="text-[var(--color-olive-green)] hover:text-[var(--color-forest-teal)] ml-2"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
    )
}

export const ErrorToast: React.FC<ToastProps> = (props) => {
    const { title, id, description } = props
    return (
        <div className="bg-[#fdecec] border border-[#f5c9c9] rounded-md p-3 shadow-md text-sm flex items-start">
          <AlertCircle className="text-[var(--color-destructive)] h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-[#b92929] font-medium">{title}</p>
            <p className="text-[var(--color-destructive)] text-xs mt-1">
              {description}
            </p>
            <div className="mt-2 flex gap-2">
              <button 
                onClick={() => SonnerToast.dismiss(id)}
                className="px-2 py-1 text-xs bg-[#fad9d9] hover:bg-[#f5c9c9] text-[var(--color-destructive)] rounded"
              >
                Dismiss
              </button>
            </div>
          </div>
          <button 
            onClick={() => SonnerToast.dismiss(id)}
            className="text-[var(--color-destructive)] hover:text-[#b92929] ml-2"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
    )
}

export const InfoToast: React.FC<ToastProps> = (props) => {
    const { title, id, description } = props
    return (
        <div className="bg-[#e8f2fa] border border-[#c9dff0] rounded-md p-3 shadow-md text-sm flex items-start">
          <Info className="text-[var(--color-palette-dark)] h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-[var(--color-palette-dark)] font-medium">{title}</p>
            <p className="text-[var(--color-palette-dark-2)] text-xs mt-1">
              {description}
            </p>
            <div className="mt-2 flex gap-2">
              <button 
                onClick={() => SonnerToast.dismiss(id)}
                className="px-2 py-1 text-xs bg-[#d9e7f5] hover:bg-[#c9dff0] text-[var(--color-palette-dark)] rounded"
              >
                Dismiss
              </button>
            </div>
          </div>
          <button 
            onClick={() => SonnerToast.dismiss(id)}
            className="text-[var(--color-palette-dark)] hover:text-[var(--color-palette-dark-2)] ml-2"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
    )
}

export const LoadingToast: React.FC<ToastProps> = (props) => {
    const { title, id, description } = props
    return (
        <div className="bg-[var(--color-palette-light-cream)] border border-[var(--color-palette-beige)] rounded-md p-3 shadow-md text-sm flex items-start">
          <Loader2 className="text-[var(--color-palette-gold)] h-4 w-4 mr-2 mt-0.5 flex-shrink-0 animate-spin" />
          <div className="flex-1">
            <p className="text-[var(--color-palette-dark)] font-medium">{title}</p>
            <p className="text-[var(--color-palette-gray)] text-xs mt-1">
              {description}
            </p>
          </div>
          <button 
            onClick={() => SonnerToast.dismiss(id)}
            className="text-[var(--color-palette-gray)] hover:text-[var(--color-palette-dark)] ml-2"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
    )
}

export const DefaultToast: React.FC<ToastProps> = (props) => {
    const { title, id, description } = props
    return (
        <div className="bg-[var(--color-palette-beige-1)] border border-[var(--color-palette-beige)] rounded-md p-3 shadow-md text-sm flex items-start">
          <div className="flex-1">
            <p className="text-[var(--color-palette-dark)] font-medium">{title}</p>
            <p className="text-[var(--color-palette-gray)] text-xs mt-1">
              {description}
            </p>
            <div className="mt-2 flex gap-2">
              <button 
                onClick={() => SonnerToast.dismiss(id)}
                className="px-2 py-1 text-xs bg-[var(--color-palette-cream)] hover:bg-[var(--color-palette-gold-light)] text-[var(--color-palette-dark)] rounded"
              >
                Dismiss
              </button>
            </div>
          </div>
          <button 
            onClick={() => SonnerToast.dismiss(id)}
            className="text-[var(--color-palette-gray)] hover:text-[var(--color-palette-dark)] ml-2"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
    )
}