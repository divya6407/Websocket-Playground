import React from 'react';

export default function Loading() {
    return (
        <div >
            <div className="flex items-center space-x-2">
                <span className="sr-only">Loading...</span>
                <div className="h-3 w-3 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]"></div>
                <div className="h-3 w-3 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]"></div>
                <div className="h-3 w-3 animate-bounce rounded-full bg-primary"></div>
            </div>
        </div>
    );
}
