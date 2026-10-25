using System.Globalization;

namespace MakerCam.Core;

/// <summary>
/// Small helpers that reproduce the exact numeric behaviour of the JavaScript
/// implementation this library was ported from. Matching these details keeps
/// generated G-code and saved projects byte-identical to the web app.
/// </summary>
public static class JsMath
{
    /// <summary>
    /// JavaScript's <c>Math.round</c>: nearest integer, halves toward positive
    /// infinity (so <c>Math.round(-2.5) == -2</c>).
    /// </summary>
    public static double Round(double x) => Math.Floor(x + 0.5);

    /// <summary>
    /// JavaScript's <c>Number.prototype.toFixed</c> for the value range used by
    /// this library: exact binary value rounded, ties away from zero.
    /// </summary>
    public static string ToFixed(double n, int decimals)
    {
        if (!double.IsFinite(n)) return "0";
        var rounded = Math.Round(n, decimals, MidpointRounding.AwayFromZero);
        return rounded.ToString("F" + decimals.ToString(CultureInfo.InvariantCulture),
            CultureInfo.InvariantCulture);
    }

    /// <summary>
    /// JavaScript's default number-to-string conversion for values already
    /// quantised to four decimal places (the only place the original code
    /// stringifies coordinates). Prints <c>0</c> for both zeros.
    /// </summary>
    public static string FormatShort(double n)
    {
        if (n == 0) return "0";
        return n.ToString("0.###############", CultureInfo.InvariantCulture);
    }
}
