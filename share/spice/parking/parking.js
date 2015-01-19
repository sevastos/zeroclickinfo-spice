(function (env) {
    "use strict";
    
    var userLanguage = navigator.languages || // New (experimental)
        navigator.systemLanguage || // IE
        navigator.language;    // Old
    
    
    var canUseIntl = (  
        window.Intl && 
        window.Intl.NumberFormat && // Check if Intl.NumberFormat exists
        // and test for issues like https://code.google.com/p/chromium/issues/detail?id=370849
        Intl.NumberFormat('en-us',{ style: 'currency', currency: 'USD' }).format(1) !==
        Intl.NumberFormat('en-us',{ style: 'currency', currency: 'CAD' }).format(1));    
    
    // item.price is an unformatted decimal number
    // item.currencyFormatted is an ISO 4217 currency code
    // attempt to use Intl.NumberFormat to generate a localized price 
    // otherwise make pritty prices for USD and CAD or fallback on the ISO 4217 currency code
    function priceFormatter(item) { 
        if (canUseIntl) {
            return  new Intl.NumberFormat(
                userLanguage, {   
                    style: 'currency',
                    currency: item.currencyFormatted,
                    maximumFractionDigits: 2,
                    minimumFractionDigits: 2 })
                .format(item.price);
        } else {
            var prefix = item.currencyFormatted.toUpperCase();
            
            if(prefix === 'USD') {
                prefix = '$';
            }
            if(prefix === 'CAD'){
                prefix = 'CA$';
            }
            
            return prefix + parseFloat(item.price).toFixed(2);
        }      
    }
    
    env.ddg_spice_parking = function(api_result){
        
        // Check that results were returned successfully
        if (!api_result.success || api_result.resultsCount === 0) {
            return Spice.failed('parking');        
        }
        
        function normalize(item){
            // skip unless there's at least one image
            if (!item.images[0]) {
                return null;
            }
            
            // Get a localized price
            item.price = priceFormatter(item);
            
            var normalizedItem = {
                /* item */
              title: item.displayName,
              url: item.affiliateUrl,
              description: item.distanceString + " | " + item.price + "+",
              image: item.images[0].imagePathMedium,
                
                /* detail */
              heading: item.displayName,
              subtitle: item.distanceString,
              price: "Starting at " + item.price,
              img_m: item.images[0].imagePath,
              buttonUrl: item.affiliateUrl,
              abstract: item.description,
                
                /* details */
              img: item.images[0].imagePath
                
            };
            
            return normalizedItem;            
        }
        
        // Render the response
        Spice.add({
            id: "parking",
            name: "Parking",
            data: api_result.data.locations,
            meta: {
                primaryText: "Parking Near: " + api_result.data.search.displayText,                
                sourceName: "ParkingPanda.com",
                sourceUrl: 'https://www.parkingpanda.com/Search/?ref=duckduck&location=' + api_result.data.search.query
            },
            
            normalize: normalize,
            
            templates: {                
                group: 'products',
                item: 'basic_image_item',
                item_detail: 'products_item_detail',              
                options: {
                    buy: Spice.parking.buy,
                    subtitle_content: Spice.parking.subtitle,
                    detail: false,
                    brand: false,
                    rating: false,
                    moreAt: true,
                    priceAndBrand: false
                }
            }
        });
    };
}(this));
