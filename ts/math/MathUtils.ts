export class MathUtils {
    public static getItemCountCallback (amountIn: number, storageIn: number, max: number) {
        if(storageIn + amountIn <= max) return [amountIn, storageIn + amountIn];

        const diff = Math.abs(max - (storageIn + amountIn));
        
        return [amountIn - diff, max];
    }

    public static lerp (start: number, end: number, amt: number){
        return (1-amt)*start+amt*end;
      }
}