import 'dart:collection';
import 'dart:js';
import 'dart:math';
import 'dart:ui';
import 'package:chart_app/src/chart_app.dart';
import 'package:chart_app/src/helpers/marker_painter.dart';
import 'package:chart_app/src/helpers/series.dart';
import 'package:chart_app/src/misc/crosshair_controller.dart';
import 'package:chart_app/src/models/indicators.dart';
import 'package:chart_app/src/series/current_tick_indicator.dart';
import 'package:deriv_chart/deriv_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

// ignore: avoid_web_libraries_in_flutter
import 'dart:html' as html;

import 'src/models/chart_feed.dart';
import 'src/models/chart_config.dart';
import 'src/interop/dart_interop.dart';
import 'src/interop/js_interop.dart';
import 'src/markers/marker_group_series.dart';

// ignore_for_file: avoid_catches_without_on_clauses

void main() {
  runApp(const DerivChartApp());
}

/// The start of the application.
class DerivChartApp extends StatelessWidget {
  /// Initialize
  const DerivChartApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) => MaterialApp(
        theme: ThemeData(fontFamily: 'IBMPlexSans'),
        home: const _DerivChartWebAdapter(),
      );
}

class _DerivChartWebAdapter extends StatefulWidget {
  const _DerivChartWebAdapter({Key? key}) : super(key: key);

  @override
  State<_DerivChartWebAdapter> createState() => _DerivChartWebAdapterState();
}

class _DerivChartWebAdapterState extends State<_DerivChartWebAdapter> {
  _DerivChartWebAdapterState() {
    app = ChartApp(
      configModel,
      feedModel,
      indicatorsModel,
    );
    initDartInterop(app);
    JsInterop.onChartLoad();
  }

  final ChartFeedModel feedModel = ChartFeedModel();
  final ChartConfigModel configModel = ChartConfigModel();
  final IndicatorsModel indicatorsModel = IndicatorsModel();

  late final ChartApp app;
  int? rightBoundEpoch;
  bool isFollowMode = false;

  void onVisibilityChange(html.Event ev) {
    if (configModel.startWithDataFitMode || feedModel.ticks.isEmpty) {
      return;
    }

    if (html.document.visibilityState == 'visible' && isFollowMode) {
      app.wrappedController.scrollToLastTick();
    }

    if (html.document.visibilityState == 'hidden' && rightBoundEpoch != null) {
      isFollowMode = rightBoundEpoch! > feedModel.ticks.last.epoch;
    }
  }

  @override
  void initState() {
    super.initState();
    html.document.addEventListener('visibilitychange', onVisibilityChange);
  }

  @override
  void dispose() {
    super.dispose();
    html.document.removeEventListener('visibilitychange', onVisibilityChange);
  }

  double? _getVerticalPaddingFraction(double height) {
    if (configModel.yAxisMargin != null && height != 0) {
      final double verticalPaddingFraction = max(
              configModel.yAxisMargin!.top ?? 0,
              configModel.yAxisMargin!.bottom ?? 0) /
          height;

      return max(verticalPaddingFraction, 0.1);
    }
    return null;
  }

  double _getMaxCurrentTickOffset() {
    final double currentTickOffset =
        configModel.startWithDataFitMode ? 150 : 300;
    return configModel.isMobile ? currentTickOffset / 1.25 : currentTickOffset;
  }

  double? _getMinIntervalWidth() {
    if (configModel.startWithDataFitMode &&
        configModel.style == ChartStyle.line) {
      return 0.1;
    }
    return null;
  }

  double? _getMaxIntervalWidth() {
    if (configModel.style == ChartStyle.candles) {
      return 240;
    }
    return null;
  }

  void _onCrosshairHover(
    PointerHoverEvent ev,
    EpochToX epochToX,
    QuoteToY quoteToY,
    EpochFromX epochFromX,
    QuoteFromY quoteFromY,
    AddOnConfig? config,
  ) {
    final CrosshairController controller =
        app.wrappedController.getCrosshairController();

    int? index;

    if (config != null) {
      index = indicatorsModel.indicatorsRepo.items
          .indexOf(config as IndicatorConfig);
    }

    // ignore: cascade_invocations
    controller
      ..getEpochFromX_ = epochFromX
      ..getQuoteFromY_ = quoteFromY
      ..getXFromEpoch_ = epochToX
      ..getYFromQuote_ = quoteToY;

    JsInterop.onCrosshairHover(
      ev.position.dx,
      ev.position.dy,
      ev.localPosition.dx,
      ev.localPosition.dy,
      index,
    );
  }

  @override
  Widget build(BuildContext _) => MultiProvider(
        providers: <ChangeNotifierProvider<ChangeNotifier>>[
          ChangeNotifierProvider<ChartConfigModel>.value(value: configModel),
          ChangeNotifierProvider<ChartFeedModel>.value(value: feedModel)
        ],
        child: Scaffold(
          body: LayoutBuilder(
            builder: (BuildContext _, BoxConstraints constraints) => Center(
              child: Column(children: <Widget>[
                Expanded(
                  child: Consumer2<ChartConfigModel, ChartFeedModel>(builder:
                      (BuildContext context, ChartConfigModel configModel,
                          ChartFeedModel feedModel, Widget? child) {
                    final bool showChart = app.getChartVisibilitity();

                    if (showChart == false) {
                      return Container(
                        color: configModel.theme is ChartDefaultLightTheme
                            ? Colors.white
                            : Colors.black,
                        constraints: const BoxConstraints.expand(),
                      );
                    }

                    final int granularity = app.getQuotesInterval() ?? 1000;

                    final DataSeries<Tick> mainSeries =
                        getDataSeries(feedModel, configModel, granularity);

                    final Color latestTickColor = Color.fromRGBO(
                        255, 68, 81, configModel.isSymbolClosed ? 0.32 : 1);

                    return DerivChart(
                      mainSeries: mainSeries,
                      annotations: feedModel.ticks.isNotEmpty
                          ? <Barrier>[
                              if (configModel.isLive)
                                CurrentTickIndicator(
                                  feedModel.ticks.last,
                                  id: 'last_tick_indicator',
                                  style: HorizontalBarrierStyle(
                                      color: latestTickColor,
                                      labelShape: LabelShape.pentagon,
                                      hasBlinkingDot:
                                          !configModel.isSymbolClosed,
                                      hasArrow: false,
                                      textStyle: const TextStyle(
                                        fontSize: 12,
                                        height: 1.3,
                                        fontWeight: FontWeight.w600,
                                        color: Colors.white,
                                        fontFeatures: <FontFeature>[
                                          FontFeature.tabularFigures()
                                        ],
                                      )),
                                  visibility: HorizontalBarrierVisibility
                                      .keepBarrierLabelVisible,
                                ),
                            ]
                          : null,
                      pipSize: configModel.pipSize,
                      granularity: granularity,
                      controller: app.wrappedController.getChartController(),
                      theme: configModel.theme,
                      onVisibleAreaChanged: (int leftEpoch, int rightEpoch) {
                        if (!feedModel.waitingForHistory &&
                            feedModel.ticks.isNotEmpty &&
                            leftEpoch < feedModel.ticks.first.epoch) {
                          feedModel.loadHistory(2500);
                        }
                        rightBoundEpoch = rightEpoch;
                        JsInterop.onVisibleAreaChanged(leftEpoch, rightEpoch);
                      },
                      onQuoteAreaChanged:
                          (double topQuote, double bottomQuote) {
                        JsInterop.onQuoteAreaChanged(topQuote, bottomQuote);
                      },
                      markerSeries: MarkerGroupSeries(
                        SplayTreeSet<Marker>(),
                        markerGroupList: configModel.markerGroupList,
                        markerGroupIconPainter: getMarkerGroupPainter(app),
                        controller: app.wrappedController,
                        yAxisWidth: app.yAxisWidth,
                        isMobile: app.configModel.isMobile,
                      ),
                      drawingToolsRepo: indicatorsModel.drawingToolsRepo,
                      indicatorsRepo: indicatorsModel.indicatorsRepo,
                      dataFitEnabled: configModel.startWithDataFitMode,
                      showCrosshair: configModel.showCrosshair,
                      isLive: configModel.isLive,
                      onCrosshairDisappeared: JsInterop.onCrosshairDisappeared,
                      onCrosshairHover: _onCrosshairHover,
                      maxCurrentTickOffset: _getMaxCurrentTickOffset(),
                      msPerPx: configModel.startWithDataFitMode
                          ? null
                          : configModel.msPerPx,
                      minIntervalWidth: _getMinIntervalWidth(),
                      maxIntervalWidth: _getMaxIntervalWidth(),
                      bottomChartTitleMargin: configModel.leftMargin != null
                          ? EdgeInsets.only(left: configModel.leftMargin!)
                          : null,
                      verticalPaddingFraction:
                          _getVerticalPaddingFraction(constraints.maxHeight),
                      showDataFitButton: false,
                      showScrollToLastTickButton: false,
                      loadingAnimationColor: Colors.transparent,
                    );
                  }),
                ),
              ]),
            ),
          ),
        ),
      );
}
