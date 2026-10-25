package com.lorentz.SVG
{
   public class SVGUtil
   {
      
      protected static const presentationStyles:* = ["display","visibility","opacity","fill","fill-opacity","fill-rule","stroke","stroke-opacity","stroke-width","stroke-linecap","stroke-linejoin","font-size","font-family","font-weight","text-anchor","dominant-baseline"];
      
      public function SVGUtil()
      {
         super();
      }
      
      public static function styleToObject(style:String) : Object
      {
         var prop:String = null;
         var split:Array = null;
         style = StringUtil.trim(style);
         style = StringUtil.rtrim(style,";");
         var obj:Object = new Object();
         for each(prop in style.split(";"))
         {
            split = prop.split(":");
            if(split.length == 2)
            {
               obj[StringUtil.trim(split[0])] = StringUtil.trim(split[1]);
            }
         }
         return obj;
      }
      
      public static function mergeObjectStyles(obja:Object, objb:Object) : Object
      {
         var prop:String = null;
         var p:String = null;
         var temp:Object = new Object();
         for(prop in obja)
         {
            temp[prop] = obja[prop];
         }
         for(p in objb)
         {
            temp[p] = objb[p];
         }
         return temp;
      }
      
      public static function presentationStyleToObject(elt:XML) : Object
      {
         var styleName:String = null;
         var obj:Object = new Object();
         for each(styleName in presentationStyles)
         {
            if("@" + styleName in elt)
            {
               obj[styleName] = elt["@" + styleName];
            }
         }
         return obj;
      }
   }
}

