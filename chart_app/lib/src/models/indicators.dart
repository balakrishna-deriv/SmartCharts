import 'dart:convert';
import 'dart:math';

import 'package:deriv_chart/deriv_chart.dart' hide AddOnsRepository;
import 'package:chart_app/src/add_ons/add_ons_repository.dart';
import 'package:chart_app/src/interop/js_interop.dart';
import 'package:flutter/material.dart';
import 'package:collection/collection.dart' show IterableExtension;

/// State and methods of chart web adapter config.
class IndicatorsModel extends ChangeNotifier {
  /// Initialize
  IndicatorsModel(this._controller);

  late final ChartController _controller;

  /// Indicators repo
  final AddOnsRepository<IndicatorConfig> indicatorsRepo =
      AddOnsRepository<IndicatorConfig>(
    onEditCallback: JsInterop.indicators?.onEdit,
    onRemoveCallback: JsInterop.indicators?.onRemove,
    onSwapCallback: JsInterop.indicators?.onSwap,
  );

  /// Drawing tools repo
  final AddOnsRepository<DrawingToolConfig> drawingToolsRepo =
      AddOnsRepository<DrawingToolConfig>();

  /// To add or update an indicator
  void addOrUpdateIndicator(String dataString, int? index) {
    final Map<String, dynamic> config = json.decode(dataString)..remove('id');

    final IndicatorConfig? indicatorConfig = IndicatorConfig.fromJson(config);

    if (indicatorConfig != null) {
      index != null && index > -1
          ? indicatorsRepo.updateAt(index, indicatorConfig)
          : indicatorsRepo.add(indicatorConfig);
    }
  }

  /// To remove an existing indicator
  void removeIndicator(int index) {
    indicatorsRepo.remove(index);
  }

  /// To clear all indicators
  void clearIndicators() {
    indicatorsRepo.clear();
  }

  String? _getQuote(List<Tick>? entries, int epoch,
      {int pipSize = 2, int offset = 0}) {
    final Tick? tickAtEpoch =
        entries?.firstWhereOrNull((Tick t) => t.epoch == epoch);

    Tick? tick = tickAtEpoch;

    if (offset != 0 && tickAtEpoch != null) {
      final int index = entries!.indexOf(tickAtEpoch);
      tick = entries[index - offset];
    }

    return tick?.quote.toStringAsFixed(pipSize);
  }

  /// Gets the tooltip content for indicator series
  List<JsIndicatorTooltip?>? getTooltipContent(int epoch) {
    final List<Series> seriesList =
        _controller.getSeriesList?.call() ?? <Series>[];
    final List<IndicatorConfig> indicatorConfigsList =
        _controller.getIndicatorConfigsList?.call() ?? <IndicatorConfig>[];

    final List<Series> sortedSeriesList = <Series>[];

    indicatorConfigsList.forEachIndexed((int index, IndicatorConfig config) {
      final int configIndex = indicatorsRepo.items.indexOf(config);
      if (configIndex > -1) {
        sortedSeriesList.insert(configIndex, seriesList[index]);
      }
    });

    final List<JsIndicatorTooltip?> tooltipContent = <JsIndicatorTooltip>[];

    for (final ChartData item in sortedSeriesList) {
      if (item is AwesomeOscillatorSeries) {
        tooltipContent.add(JsIndicatorTooltip(
          name: 'AwesomeOscillator',
          values: <String?>[_getQuote(item.entries, epoch)],
        ));
      } else if (item is DPOSeries) {
        tooltipContent.add(JsIndicatorTooltip(name: 'dpo', values: <String?>[
          _getQuote(
            item.dpoSeries.entries,
            epoch,
            offset: item.dpoSeries.offset,
          )
        ]));
      } else if (item is GatorSeries) {
        tooltipContent.add(JsIndicatorTooltip(name: 'gator', values: <String?>[
          _getQuote(
            item.gatorTopSeries.entries,
            epoch,
            offset:
                min(item.gatorConfig.jawOffset, item.gatorConfig.teethOffset),
          ),
          _getQuote(
            item.gatorBottomSeries.entries,
            epoch,
            offset:
                min(item.gatorConfig.teethOffset, item.gatorConfig.lipsOffset),
          )
        ]));
      } else if (item is MACDSeries) {
        tooltipContent.add(JsIndicatorTooltip(name: 'macd', values: <String?>[
          _getQuote(item.macdSeries.entries, epoch),
          _getQuote(item.signalMACDSeries.entries, epoch),
          _getQuote(item.macdHistogramSeries.entries, epoch)
        ]));
      } else if (item is ROCSeries) {
        tooltipContent.add(JsIndicatorTooltip(name: 'ROC', values: <String?>[
          _getQuote(item.entries, epoch),
        ]));
      } else if (item is RSISeries) {
        tooltipContent.add(JsIndicatorTooltip(name: 'RSI', values: <String?>[
          _getQuote(item.entries, epoch),
        ]));
      } else if (item is StochasticOscillatorSeries) {
        tooltipContent.add(
            JsIndicatorTooltip(name: 'StochasticOscillator', values: <String?>[
          _getQuote(item.fastPercentStochasticIndicatorSeries.entries, epoch),
          _getQuote(item.slowStochasticIndicatorSeries.entries, epoch),
        ]));
      } else if (item is SMISeries) {
        tooltipContent.add(JsIndicatorTooltip(name: 'SMI', values: <String?>[
          _getQuote(item.smiSeries.entries, epoch),
          _getQuote(item.smiSignalSeries.entries, epoch),
        ]));
      } else {
        tooltipContent.add(null);
      }
    }
    return tooltipContent;
  }
}