import * as React from "react";
import { cn } from "@/utils/styles";
import { AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: "default" | "floating";
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    type, 
    label, 
    error, 
    success, 
    helperText, 
    leftIcon, 
    rightIcon, 
    variant = "default",
    placeholder,
    ...props 
  }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const [isFocused, setIsFocused] = React.useState(false);
    const [hasValue, setHasValue] = React.useState(false);

    const isPassword = type === "password";
    const inputType = isPassword && showPassword ? "text" : type;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasValue(e.target.value.length > 0);
      props.onChange?.(e);
    };

    React.useEffect(() => {
      if (props.value || props.defaultValue) {
        setHasValue(true);
      }
    }, [props.value, props.defaultValue]);

    if (variant === "floating") {
      return (
        <div className="relative">
          <div className="relative">
            {leftIcon && (
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10">
                {leftIcon}
              </div>
            )}
            
            <input
              type={inputType}
              className={cn(
                "peer w-full px-4 py-3 text-gray-900 bg-transparent border-2 border-gray-300 rounded-lg outline-none transition-all duration-200 placeholder-transparent",
                "focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10",
                leftIcon && "pl-10",
                (rightIcon || isPassword) && "pr-10",
                error && "border-red-500 focus:border-red-500 focus:ring-red-500/10",
                success && "border-green-500 focus:border-green-500 focus:ring-green-500/10",
                className
              )}
              placeholder={placeholder || label || ""}
              ref={ref}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onChange={handleInputChange}
              {...props}
            />
            
            {label && (
              <label
                className={cn(
                  "absolute left-4 transition-all duration-200 pointer-events-none",
                  "peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base",
                  "peer-focus:top-2 peer-focus:text-xs peer-focus:text-blue-600 peer-focus:bg-white peer-focus:px-1 peer-focus:-translate-y-1/2",
                  (hasValue || isFocused) && "top-2 text-xs bg-white px-1 -translate-y-1/2",
                  (hasValue || isFocused) && !error && !success && "text-blue-600",
                  leftIcon && "peer-placeholder-shown:left-10 peer-focus:left-4",
                  error && "text-red-500",
                  success && "text-green-500"
                )}
              >
                {label}
              </label>
            )}

            {(rightIcon || isPassword) && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {isPassword ? (
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                ) : (
                  rightIcon
                )}
              </div>
            )}
          </div>

          {(error || success || helperText) && (
            <div className="mt-2 flex items-center gap-2">
              {error && (
                <>
                  <AlertCircle size={16} className="text-red-500" />
                  <p className="text-sm text-red-500">{error}</p>
                </>
              )}
              {success && (
                <>
                  <CheckCircle2 size={16} className="text-green-500" />
                  <p className="text-sm text-green-500">{success}</p>
                </>
              )}
              {helperText && !error && !success && (
                <p className="text-sm text-gray-500">{helperText}</p>
              )}
            </div>
          )}
        </div>
      );
    }

    // Default variant
    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              {leftIcon}
            </div>
          )}
          
          <input
            type={inputType}
            className={cn(
              "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground transition-all duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:border-transparent",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "hover:border-gray-400",
              leftIcon && "pl-10",
              (rightIcon || isPassword) && "pr-10",
              error && "border-red-500 focus-visible:ring-red-500",
              success && "border-green-500 focus-visible:ring-green-500",
              className
            )}
            placeholder={placeholder}
            ref={ref}
            onChange={handleInputChange}
            {...props}
          />
          
          {(rightIcon || isPassword) && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {isPassword ? (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              ) : (
                rightIcon
              )}
            </div>
          )}
        </div>

        {(error || success || helperText) && (
          <div className="flex items-center gap-2">
            {error && (
              <>
                <AlertCircle size={16} className="text-red-500" />
                <p className="text-sm text-red-500">{error}</p>
              </>
            )}
            {success && (
              <>
                <CheckCircle2 size={16} className="text-green-500" />
                <p className="text-sm text-green-500">{success}</p>
              </>
            )}
            {helperText && !error && !success && (
              <p className="text-sm text-gray-500">{helperText}</p>
            )}
          </div>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
