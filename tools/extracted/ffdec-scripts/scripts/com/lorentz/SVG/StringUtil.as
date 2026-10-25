package com.lorentz.SVG
{
   public class StringUtil
   {
      
      public function StringUtil()
      {
         super();
      }
      
      public static function trim(input:String, char:String = " ") : String
      {
         return StringUtil.ltrim(StringUtil.rtrim(input,char),char);
      }
      
      public static function ltrim(input:String, char:String = " ") : String
      {
         var size:Number = input.length;
         for(var i:Number = 0; i < size; i++)
         {
            if(input.charAt(i) != char)
            {
               return input.substring(i);
            }
         }
         return "";
      }
      
      public static function rtrim(input:String, char:String = " ") : String
      {
         var size:Number = input.length;
         for(var i:Number = size; i > 0; i--)
         {
            if(input.charAt(i - 1) != char)
            {
               return input.substring(0,i);
            }
         }
         return "";
      }
      
      public static function remove(input:String, remove:String) : String
      {
         return StringUtil.replace(input,remove,"");
      }
      
      public static function replace(input:String, replace:String, replaceWith:String) : String
      {
         var j:Number = NaN;
         var sb:String = new String();
         var found:Boolean = false;
         var sLen:Number = input.length;
         var rLen:Number = replace.length;
         for(var i:Number = 0; i < sLen; i++)
         {
            if(input.charAt(i) == replace.charAt(0))
            {
               found = true;
               for(j = 0; j < rLen; j++)
               {
                  if(input.charAt(i + j) != replace.charAt(j))
                  {
                     found = false;
                     break;
                  }
               }
               if(found)
               {
                  sb += replaceWith;
                  i += rLen - 1;
                  continue;
               }
            }
            sb += input.charAt(i);
         }
         return sb;
      }
      
      public static function shrinkSequencesOf(s:String, ch:String) : String
      {
         var len:int = s.length;
         var idx:int = 0;
         var idx2:int = 0;
         var rs:String = "";
         while(true)
         {
            idx2 = s.indexOf(ch,idx) + 1;
            if(idx2 == 0)
            {
               break;
            }
            rs += s.substring(idx,idx2);
            idx = idx2;
            while(s.charAt(idx) == ch && idx < len)
            {
               idx++;
            }
         }
         return rs + s.substring(idx,len);
      }
   }
}

