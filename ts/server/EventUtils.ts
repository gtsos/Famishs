export function getNodeParams (params: string) {
    const obData = params.split("-");

    const finalArray = [];

    for(let i = 1; i < obData.length; i++) 
        finalArray.push(obData[i]);
    
    return finalArray;
}