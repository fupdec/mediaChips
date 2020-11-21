<template>
	<v-app-bar app dense clipped-left :color="colorHeader" extension-height="32">
    <v-tooltip bottom>
      <template v-slot:activator="{ on }">
        <v-btn @click="$store.state.Tags.dialogEditTag = true" 
          icon tile v-on="on"> 
          <v-icon>mdi-pencil</v-icon>
        </v-btn>
      </template>
      <span>Edit tag</span>
    </v-tooltip>

    <v-menu v-if="$store.state.Tags.activeTab===0"
      v-model="filtersMenuForVideos" offset-y nudge-bottom="10" :close-on-content-click="false">
      <template #activator="{ on: onMenu }">
        <v-tooltip bottom>
          <template #activator="{ on: onTooltip }">
            <v-btn v-on="{ ...onMenu, ...onTooltip }" @click="filtersMenuForVideos=true" icon tile>
              <v-badge 
                :value="filterBadgeVideos" :content="filteredVideosTotal" 
                overlap bottom :dot="filteredVideosTotal==0" style="z-index: 5;"
              ><v-icon>mdi-filter</v-icon>
              </v-badge>
            </v-btn>
          </template>
          <span>Filter videos</span>
        </v-tooltip>
      </template>
      <v-card width="800">
        <v-card-title class="py-1">
          <span class="headline">Filter videos</span>
          <v-spacer></v-spacer>
          <v-tooltip bottom>
            <template v-slot:activator="{ on, attrs }">
              <v-icon v-bind="attrs" v-on="on" class="mx-2">
                mdi-help-circle-outline
              </v-icon>
            </template>
            <span>
              By default, fields with multiple values operate according to the "OR" logic.
              <br>To change the logic click on the icons
              <v-icon dark>mdi-math-norm</v-icon> and <v-icon dark>mdi-ampersand</v-icon>,
              <br>which corresponds to the logics "OR" and "AND".
            </span>
          </v-tooltip>
          <v-icon>mdi-filter</v-icon>
        </v-card-title>
        <v-divider></v-divider>
        <v-container fluid class="py-0">
          <v-row>
            <v-col cols="12" class="pb-0">
              <v-text-field 
                v-model="$store.state.Videos.filters.path" 
                clearable dense hide-details outlined
                label="Path or filename include" prepend-icon="mdi-folder-text-outline"
              />
            </v-col>
            <v-col cols="12" sm="7">
              <v-autocomplete
                v-model="$store.state.Videos.filters.performers" :items="performers"
                item-text="name" item-value="name" no-data-text="No more performers"
                class="mb-4 select-small-chips hidden-close" label="Performers" 
                multiple hide-selected hide-details clearable dense outlined
                prepend-icon="mdi-account" append-icon="" 
                :menu-props="{contentClass:'list-with-preview'}"
                @click:prepend-inner="changeFilterPerformersLogic" 
                :prepend-inner-icon="filterPerformersLogicIcon"
                :filter="filterItemsPerformers"
              >
                <template v-slot:selection="data">
                  <v-chip close small class="my-1" close-icon="mdi-close"
                    v-bind="data.attrs" :input-value="data.selected" 
                    @click="data.select" @click:close="removePerformer(data.item)"
                    @mouseover.stop="showImage($event, data.item.id, 'performer')" 
                    @mouseleave.stop="$store.state.hoveredImage=false"
                    :color="getPerformerColorDependsRating(data.item.rating)"
                    :class="{'tag-with-favorite-performer': data.item.favorite}"
                  ><span>{{ data.item.name }}</span>
                  </v-chip>
                </template>
                <template v-slot:item="data">
                  <div class="list-item"
                    @mouseover.stop="showImage($event, data.item.id, 'performer')" 
                    @mouseleave.stop="$store.state.hoveredImage=false"
                  > 
                    <v-icon 
                      left size="12" 
                      :color="data.item.favorite===false ? 'grey' : 'pink'"
                    > mdi-heart </v-icon>
                    <v-rating 
                      class="rating-inline small mr-2"
                      v-model="data.item.rating"
                      color="yellow darken-3"
                      background-color="grey darken-1"
                      empty-icon="$ratingFull" 
                      half-icon="mdi-star-half-full"
                      dense half-increments readonly size="10"
                    />
                    <span>{{data.item.name}}</span>
                    <span v-if="data.item.aliases.length" class="aliases"> 
                      aka {{data.item.aliases.join(', ').slice(0,50)}}
                    </span>
                  </div>
                </template>
              </v-autocomplete>

              <v-autocomplete
                v-model="$store.state.Videos.filters.tags" :items="tags" 
                class="mb-4 select-small-chips hidden-close"
                item-text="name" dense label="Tags" prepend-icon="mdi-tag-outline"
                item-value="name" no-data-text="No more tags" append-icon="" 
                multiple hide-selected hide-details clearable outlined
                :menu-props="{contentClass:'list-with-preview'}"
                @click:prepend-inner="changeFilterTagsLogicForVideos" 
                :prepend-inner-icon="filterTagsLogicForVideosIcon"
                :filter="filterItemsTagsForVideos" disabled
              >
                <template v-slot:selection="data">
                  <v-chip
                    v-bind="data.attrs" small class="my-1" close-icon="mdi-close"
                    @click="data.select" @click:close="removeTagForVideos(data.item)"
                    @mouseover.stop="showImage($event, data.item.id, 'tag')" 
                    @mouseleave.stop="$store.state.hoveredImage=false"
                    :input-value="data.selected" outlined close
                    :color="data.item.color" 
                  ><span>{{ data.item.name }}</span>
                  </v-chip>
                </template>
                <template v-slot:item="data">
                  <div class="list-item"
                    @mouseover.stop="showImage($event, data.item.id, 'tag')" 
                    @mouseleave.stop="$store.state.hoveredImage=false"
                  > <v-icon left size="16" :color="data.item.color"> mdi-tag </v-icon>
                    <span>{{data.item.name}}</span>
                    <span v-if="data.item.altNames.length" class="aliases"> 
                      {{data.item.altNames.join(', ').slice(0,50)}}
                    </span>
                  </div>
                </template>
              </v-autocomplete>

              <v-autocomplete
                v-model="$store.state.Videos.filters.websites" :items="websites" 
                class="mb-4 select-small-chips hidden-close" append-icon="" 
                item-text="name" dense label="Websites" prepend-icon="mdi-web"
                item-value="name" no-data-text="No more websites" 
                multiple hide-selected hide-details clearable outlined
                :menu-props="{contentClass:'list-with-preview'}"
              >
                <template v-slot:selection="data">
                  <v-chip
                    v-bind="data.attrs" small close class="my-1" close-icon="mdi-close"
                    @click="data.select" @click:close="removeWebsite(data.item)"
                    @mouseover.stop="showImage($event, data.item.id, 'website')" 
                    @mouseleave.stop="$store.state.hoveredImage=false"
                    :input-value="data.selected" outlined label
                    :color="data.item.color"
                  ><span>{{ data.item.name }}</span>
                  </v-chip>
                </template>
                <template v-slot:item="data">
                  <div class="list-item"
                    @mouseover.stop="showImage($event, data.item.id, 'website')" 
                    @mouseleave.stop="$store.state.hoveredImage=false"
                  > <v-icon left size="16" :color="data.item.color"> mdi-web </v-icon>
                    {{data.item.name}}
                  </div>
                </template>
              </v-autocomplete>
            </v-col>
            <v-col cols="12" sm="5">
              <div class="range-wrapper">
                <v-checkbox 
                  v-model="$store.state.Videos.filters.durationActive" class="mt-0"
                  dense hide-details on-icon="mdi-clock-outline" off-icon="mdi-clock-outline"
                >
                  <template v-slot:label>
                    <span class="range-name">
                      <span>Duration</span>
                      <span>
                        {{$store.state.Videos.filters.duration[0]}} - 
                        {{$store.state.Videos.filters.duration[1]}}
                        <span class="unit">min</span>
                      </span>
                    </span>
                  </template>
                </v-checkbox>
                <v-range-slider 
                  v-model="$store.state.Videos.filters.duration" 
                  :disabled="!$store.state.Videos.filters.durationActive"
                  hide-details :min="0" :max="maxDuration"
                />
              </div>
              <div class="range-wrapper">
                <v-checkbox 
                  v-model="$store.state.Videos.filters.sizeActive" class="mt-0"
                  dense hide-details on-icon="mdi-harddisk" off-icon="mdi-harddisk"
                >
                  <template v-slot:label>
                    <span class="range-name">
                      <span>File size</span>  
                      <span>
                        {{$store.state.Videos.filters.size[0]}} - 
                        {{$store.state.Videos.filters.size[1]}}
                        <span class="unit">Gb</span>
                      </span>
                    </span>
                  </template>
                </v-checkbox>
                <v-range-slider 
                  v-model="$store.state.Videos.filters.size" 
                  :disabled="!$store.state.Videos.filters.sizeActive"
                  hide-details :min="0" :max="20" step="0.1"
                />
              </div>
              <div class="quality-container mb-2">
                <div><v-icon left>mdi-video-switch-outline</v-icon>Video quality</div>
                <v-btn-toggle
                  v-model="$store.state.Videos.filters.quality"
                  class="grouped-buttons" dense multiple color="primary"
                >
                  <v-btn outlined :value="2160">4K</v-btn>
                  <v-btn outlined :value="1080">1080p</v-btn>
                  <v-btn outlined :value="720">720p</v-btn>
                  <v-btn outlined :value="480">480p</v-btn>
                </v-btn-toggle>
              </div>
            </v-col>
          </v-row>
        </v-container>
        <v-card-actions class="pt-0">
          <v-spacer></v-spacer>

          <v-btn small class="mr-4 mb-4" color="primary" outlined @click="resetAllFiltersForVideos(), filtersMenuForVideos=false">
            <v-icon left>mdi-filter-off</v-icon> Reset all filters
          </v-btn>

          <v-btn small class="mb-4 mr-4" color="primary" @click="addNewTabForVideos(), filtersMenuForVideos=false">
            <v-icon left>mdi-tab-plus</v-icon> Open result in new tab
          </v-btn>
          
          <v-btn small class="mr-4 mb-4" color="primary" @click="applyAllFiltersForVideos(), filtersMenuForVideos=false">
            <v-icon left>mdi-filter</v-icon> Apply filters
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-menu>

    <v-tooltip v-if="$store.state.Tags.activeTab===0" bottom>
      <template v-slot:activator="{ on }">
        <v-btn @click="resetAllFiltersForVideos" icon tile v-on="on"> 
          <v-icon>mdi-filter-off</v-icon>
        </v-btn>
      </template>
      <span>Reset all filters</span>
    </v-tooltip>

    <v-tooltip v-if="$store.state.Tags.activeTab===0" bottom>
      <template v-slot:activator="{ on }">
        <v-btn @click="toggleFavoritesForVideos" icon tile v-on="on"> 
          <v-icon v-if="$store.state.Videos.filters.favorite">mdi-heart</v-icon>
          <v-icon v-else>mdi-heart-outline</v-icon>
        </v-btn>
      </template>
      <span v-if="$store.state.Videos.filters.favorite">Show all</span>
      <span v-else>Show favorites</span>
    </v-tooltip>

    <v-tooltip v-if="$store.state.Tags.activeTab===0" bottom>
      <template v-slot:activator="{ on }">
        <v-btn @click="toggleBookmarksForVideos" icon tile v-on="on"> 
          <v-icon v-if="$store.state.Videos.filters.bookmark">mdi-bookmark</v-icon>
          <v-icon v-else>mdi-bookmark-outline</v-icon>
        </v-btn>
      </template>
      <span v-if="$store.state.Videos.filters.bookmark">Show all</span>
      <span v-else>Show bookmarks</span>
    </v-tooltip>
    
    <v-menu v-if="$store.state.Tags.activeTab===0" offset-y nudge-bottom="10" open-on-hover close-delay="1000" :close-on-content-click="false">
      <template v-slot:activator="{ on, attrs }">
        <v-btn v-bind="attrs"  v-on="on" icon tile>
          <v-icon>mdi-sort</v-icon>
        </v-btn>
      </template>
      <v-card>
        <v-btn-toggle v-model="sortButtonsForVideos" mandatory class="group-buttons-sort" color="primary">
          <v-tooltip bottom>
            <template v-slot:activator="{ on }">
              <v-btn outlined @click="toggleSortDirectionForVideos" value="name" v-on="on">
                <v-icon size="20">mdi-alphabetical-variant</v-icon>
                <v-icon right size="12" v-if="sortButtonsForVideos==='name' && sortDirectionForVideos==='desc'">
                  mdi-arrow-up-bold-outline
                </v-icon>
                <v-icon right size="12" v-if="sortButtonsForVideos==='name' && sortDirectionForVideos==='asc'">
                  mdi-arrow-down-bold-outline
                </v-icon>
              </v-btn>
            </template>
            <span>Sort by name</span>
          </v-tooltip>
          <v-tooltip bottom>
            <template v-slot:activator="{ on }">
              <v-btn outlined @click="toggleSortDirectionForVideos" value="duration" v-on="on">
                <v-icon size="20">mdi-clock-outline</v-icon>
                <v-icon right size="12" v-if="sortButtonsForVideos==='duration' && sortDirectionForVideos==='desc'">
                  mdi-arrow-down-bold-outline
                </v-icon>
                <v-icon right size="12" v-if="sortButtonsForVideos==='duration' && sortDirectionForVideos==='asc'">
                  mdi-arrow-up-bold-outline
                </v-icon>
              </v-btn>
            </template>
            <span>Sort by duration</span>
          </v-tooltip>
          <v-tooltip bottom>
            <template v-slot:activator="{ on }">
            <v-btn outlined @click="toggleSortDirectionForVideos" value="size" v-on="on">
              <v-icon size="22">mdi-harddisk</v-icon>
              <v-icon right size="12" v-if="sortButtonsForVideos==='size' && sortDirectionForVideos==='desc'">
                mdi-arrow-down-bold-outline
              </v-icon>
              <v-icon right size="12" v-if="sortButtonsForVideos==='size' && sortDirectionForVideos==='asc'">
                mdi-arrow-up-bold-outline
              </v-icon>
            </v-btn>
            </template>
            <span>Sort by size</span>
          </v-tooltip>
          <v-tooltip bottom>
            <template v-slot:activator="{ on }">
              <v-btn outlined @click="toggleSortDirectionForVideos" value="rating" v-on="on">
                <v-icon size="20">mdi-star-outline</v-icon>
                <v-icon right size="12" v-if="sortButtonsForVideos==='rating' && sortDirectionForVideos==='desc'">
                  mdi-arrow-down-bold-outline
                </v-icon>
                <v-icon right size="12" v-if="sortButtonsForVideos==='rating' && sortDirectionForVideos==='asc'">
                  mdi-arrow-up-bold-outline
                </v-icon>
              </v-btn>
            </template>
            <span>Sort by rating</span>
          </v-tooltip>
          <v-tooltip bottom>
            <template v-slot:activator="{ on }">
              <v-btn outlined @click="toggleSortDirectionForVideos" value="date" v-on="on">
                <v-icon size="20">mdi-calendar-clock</v-icon>
                <v-icon right size="12" v-if="sortButtonsForVideos==='date' && sortDirectionForVideos==='desc'">
                  mdi-arrow-down-bold-outline
                </v-icon>
                <v-icon right size="12" v-if="sortButtonsForVideos==='date' && sortDirectionForVideos==='asc'">
                  mdi-arrow-up-bold-outline
                </v-icon>
              </v-btn>
            </template>
            <span>Sort by date added</span>
          </v-tooltip>
        </v-btn-toggle>
      </v-card>
    </v-menu>

		<v-tooltip v-if="$store.state.Tags.activeTab===0" bottom>
			<template v-slot:activator="{ on }">
				<v-btn @click="selectAllVideos" icon tile v-on="on">
					<v-icon>mdi-select-all</v-icon>
				</v-btn>
			</template>
			<span>Select all videos</span>
		</v-tooltip>
    
    <v-menu v-if="$store.state.Tags.activeTab===1"
      v-model="filtersMenuForPerformers" offset-y nudge-bottom="10" :close-on-content-click="false">
      <template #activator="{ on: onMenu }">
        <v-tooltip bottom>
          <template #activator="{ on: onTooltip }">
            <v-btn v-on="{ ...onMenu, ...onTooltip }" @click="filtersMenuForPerformers=true" icon tile>
              <v-badge 
                :value="filterBadgeForPerformers" :content="filteredPerformersTotal" 
                overlap bottom :dot="filteredPerformersTotal==0" style="z-index: 5;"
              ><v-icon>mdi-filter</v-icon>
              </v-badge>
            </v-btn>
          </template>
          <span>Filter performers</span>
        </v-tooltip>
      </template>
      <v-card width="1000">
        <v-card-title class="py-1">
          <span class="headline">Filter performers</span>
          <v-spacer></v-spacer>
          <v-btn @click="showMoreFilters = !showMoreFilters" small text>
            <span v-if="!showMoreFilters">Show extra filters</span>
            <span v-else>Hide extra filters</span>
          </v-btn>
          <v-tooltip bottom>
            <template v-slot:activator="{ on, attrs }">
              <v-icon v-bind="attrs" v-on="on" class="mx-2">
                mdi-help-circle-outline
              </v-icon>
            </template>
            <span>
              By default, fields with multiple values operate according to the "OR" logic.
              <br>To change the logic click on the icons
              <v-icon dark>mdi-math-norm</v-icon> and <v-icon dark>mdi-ampersand</v-icon>,
              <br>which corresponds to the logics "OR" and "AND".
            </span>
          </v-tooltip>
          <v-icon class="ml-2">mdi-filter</v-icon>
        </v-card-title>
        <v-divider></v-divider>
        <v-container fluid class="py-0">
          <v-row>
            <v-col cols="12" sm="4" class="pb-0 pr-0">
              <v-text-field 
                v-model="$store.state.Performers.filters.name"
                label="Name" hide-details clearable outlined dense
                prepend-icon="mdi-alphabetical-variant"
              />
            </v-col>
            <v-col cols="12" sm="2">
              <v-checkbox v-model="$store.state.Performers.filters.aliases" 
                dense hide-details class="pt-2 ma-0" label="Include aliases"
              />
            </v-col>
            <v-col cols="12" sm="6" class="pb-0">
              <v-select
                v-model="$store.state.Performers.filters.category"
                :items="$store.state.Settings.performerInfoCategory"
                label="Category" multiple hide-details outlined dense
                prepend-icon="mdi-account-group-outline"
                @click:prepend-inner="changeFilterCategoryLogic" 
                :prepend-inner-icon="filterCategoryLogicIcon" append-icon=""
                :menu-props="{contentClass:'select-dense-checkbox'}"
              ></v-select>
            </v-col>
            <v-col cols="12" sm="6">
              <v-autocomplete
                v-model="$store.state.Performers.filters.tags" :items="tags" 
                class="select-small-chips hidden-close"
                item-text="name" label="Tags" prepend-icon="mdi-tag-outline"
                item-value="name" no-data-text="No more tags" 
                multiple hide-selected hide-details clearable outlined dense
                :menu-props="{contentClass:'list-with-preview'}"
                @click:prepend-inner="changeFilterTagsLogicForPerformers" 
                :prepend-inner-icon="filterTagsLogicForPerformersIcon" append-icon=""
                :filter="filterItemsTagsForPerformers" disabled
              >
                <template v-slot:selection="data">
                  <v-chip
                    v-bind="data.attrs" small class="my-1" close-icon="mdi-close"
                    @click="data.select" @click:close="removeTagForPerformers(data.item)"
                    @mouseover.stop="showImage($event, data.item.id, 'tag')" 
                    @mouseleave.stop="$store.state.hoveredImage=false"
                    :input-value="data.selected" outlined close
                    :color="data.item.color" 
                  ><span>{{ data.item.name }}</span>
                  </v-chip>
                </template>
                <template v-slot:item="data">
                  <div class="list-item"
                    @mouseover.stop="showImage($event, data.item.id, 'tag')" 
                    @mouseleave.stop="$store.state.hoveredImage=false"
                  > <v-icon left size="16" :color="data.item.color">mdi-tag</v-icon>
                    <span>{{data.item.name}}</span>
                    <span v-if="data.item.altNames.length" class="aliases"> 
                      {{data.item.altNames.join(', ').slice(0,50)}}
                    </span>
                  </div>
                </template>
              </v-autocomplete>
            </v-col>
            <v-col cols="12" sm="6">
              <v-autocomplete
                v-model="$store.state.Performers.filters.nation" :items="countries" 
                item-text="name" item-value="name" prepend-icon="mdi-flag"
                label="Nationality" small-chips multiple hide-details hide-selected clearable
                class="select-small-chips nation-chips hidden-close" append-icon=""
                :menu-props="{contentClass:'list-with-preview'}" outlined dense
              >
                <template v-slot:selection="data">
                  <v-chip
                    v-bind="data.attrs" small class="my-1" close
                    :input-value="data.selected" label close-icon="mdi-close"
                    @click="data.select" @click:close="removeCountry(data.item)"
                  > <country-flag :country='data.item.code' size='normal'/> {{ data.item.name }}
                  </v-chip>
                </template>
                <template v-slot:item="data">
                  <div class="list-item"> 
                    <country-flag :country='data.item.code' size='small'/>
                    {{data.item.name}}
                  </div>
                </template>
              </v-autocomplete>
            </v-col>
            <v-col cols="12" sm="3" class="py-0" v-if="showMoreFilters">
              <div class="range-wrapper">
                <v-checkbox 
                  v-model="$store.state.Performers.filters.ratingActive" dense hide-details 
                  class="mt-0" on-icon="mdi-star" off-icon="mdi-star"
                >
                  <template v-slot:label>
                    <span class="range-name">
                      <span>Rating</span>
                      <span>
                        {{$store.state.Performers.filters.rating[0]}} - 
                        {{$store.state.Performers.filters.rating[1]}} 
                      </span>
                    </span>
                  </template>
                </v-checkbox>
                <v-range-slider 
                  v-model="$store.state.Performers.filters.rating" :min="0" :max="5" :step="0.5"
                  :disabled="!$store.state.Performers.filters.ratingActive" hide-details
                />
              </div>
            </v-col>
            <v-col cols="12" sm="3" class="py-0" v-if="showMoreFilters">
              <div class="range-wrapper">
                <v-checkbox 
                  v-model="$store.state.Performers.filters.ageActive" dense hide-details 
                  class="mt-0" on-icon="mdi-cake-variant" off-icon="mdi-cake-variant"
                >
                  <template v-slot:label>
                    <span class="range-name">
                      <span>Age</span>
                      <span>
                        {{$store.state.Performers.filters.age[0]}} - 
                        {{$store.state.Performers.filters.age[1]}} 
                        <span class="unit">years</span>
                      </span>
                    </span>
                  </template>
                </v-checkbox>
                <v-range-slider 
                  v-model="$store.state.Performers.filters.age" :min="18" :max="99"
                  :disabled="!$store.state.Performers.filters.ageActive" hide-details
                />
              </div>
            </v-col>
            <v-col cols="12" sm="3" class="py-0" v-if="showMoreFilters">
              <div class="range-wrapper">
                <v-checkbox 
                  v-model="$store.state.Performers.filters.careerActive" dense hide-details 
                  class="mt-0" on-icon="mdi-briefcase" off-icon="mdi-briefcase"
                >
                  <template v-slot:label>
                    <span class="range-name">
                      <span>Career</span>
                      <span>
                        {{$store.state.Performers.filters.career[0]}} - 
                        {{$store.state.Performers.filters.career[1]}} 
                        <span class="unit">years</span>
                      </span>
                    </span>
                  </template>
                </v-checkbox>
                <v-checkbox v-if="$store.state.Performers.filters.careerActive"
                  v-model="$store.state.Performers.filters.careerEnded" 
                  hide-details dense class="mt-0"
                ><template v-slot:label><span class="range-name">Career ended</span></template>
                </v-checkbox>
                <v-range-slider 
                  v-model="$store.state.Performers.filters.career" :min="1980" :max="2020"
                  :disabled="!$store.state.Performers.filters.careerActive" hide-details
                />
              </div>
            </v-col>
            <v-col cols="12" sm="3" class="py-0" v-if="showMoreFilters">
              <div class="range-wrapper">
                <v-checkbox 
                  v-model="$store.state.Performers.filters.heightActive" dense hide-details 
                  class="mt-0" on-icon="mdi-human-male-height" off-icon="mdi-human-male-height"
                >
                  <template v-slot:label>
                    <span class="range-name">
                      <span>Height</span>
                      <span>
                        {{$store.state.Performers.filters.height[0]}} - 
                        {{$store.state.Performers.filters.height[1]}}
                        <span class="unit">cm</span>
                      </span>
                    </span>
                  </template>
                </v-checkbox>
                <v-range-slider 
                  v-model="$store.state.Performers.filters.height"
                  :disabled="!$store.state.Performers.filters.heightActive" 
                  hide-details :min="100" :max="220"
                />
              </div>
            </v-col>
            <v-col cols="12" sm="3" class="py-0" v-if="showMoreFilters">
              <div class="range-wrapper">
                <v-checkbox 
                  v-model="$store.state.Performers.filters.weightActive" dense hide-details 
                  class="mt-0" on-icon="mdi-weight" off-icon="mdi-weight"
                >
                  <template v-slot:label>
                    <span class="range-name">
                      <span>Weight</span>
                      <span>
                        {{$store.state.Performers.filters.weight[0]}} - 
                        {{$store.state.Performers.filters.weight[1]}}
                        <span class="unit">kg</span>
                      </span>
                    </span>
                  </template>
                </v-checkbox>
                <v-range-slider 
                  v-model="$store.state.Performers.filters.weight" 
                  :disabled="!$store.state.Performers.filters.weightActive"
                  hide-details :min="20" :max="220"
                />
              </div>
            </v-col>
            <v-col cols="12" sm="3" class="py-0" v-if="showMoreFilters">
              <div class="range-wrapper">
                <v-checkbox 
                  v-model="$store.state.Performers.filters.braActive" dense hide-details 
                  class="mt-0" on-icon="mdi-tape-measure" off-icon="mdi-tape-measure"
                >
                  <template v-slot:label>
                    <span class="range-name">
                      <span>Bra</span>
                      <span>
                        {{$store.state.Performers.filters.bra[0]}} - 
                        {{$store.state.Performers.filters.bra[1]}}
                        <span class="unit">inch</span>
                      </span>
                    </span>
                  </template>
                </v-checkbox>
                <v-range-slider 
                  v-model="$store.state.Performers.filters.bra" 
                  :disabled="!$store.state.Performers.filters.braActive"
                  hide-details :min="20" :max="60"
                />
              </div>
            </v-col>
            <v-col cols="12" sm="3" class="py-0" v-if="showMoreFilters">
              <div class="range-wrapper">
                <v-checkbox 
                  v-model="$store.state.Performers.filters.waistActive" dense hide-details 
                  class="mt-0" on-icon="mdi-tape-measure" off-icon="mdi-tape-measure"
                >
                  <template v-slot:label>
                    <span class="range-name">
                      <span>Waist</span>
                      <span>
                        {{$store.state.Performers.filters.waist[0]}} - 
                        {{$store.state.Performers.filters.waist[1]}}
                        <span class="unit">inch</span>
                      </span>
                    </span>
                  </template>
                </v-checkbox>
                <v-range-slider 
                  v-model="$store.state.Performers.filters.waist" 
                  :disabled="!$store.state.Performers.filters.waistActive"
                  hide-details :min="20" :max="60"
                />
              </div>
            </v-col>
            <v-col cols="12" sm="3" class="py-0" v-if="showMoreFilters">
              <div class="range-wrapper fieldset">
                <v-checkbox 
                  v-model="$store.state.Performers.filters.hipActive" dense hide-details 
                  class="mt-0" on-icon="mdi-tape-measure" off-icon="mdi-tape-measure"
                >
                  <template v-slot:label>
                    <span class="range-name">
                      <span>Hip</span>
                      <span>
                        {{$store.state.Performers.filters.hip[0]}} - 
                        {{$store.state.Performers.filters.hip[1]}}
                        <span class="unit">inch</span>
                      </span>
                    </span>
                  </template>
                </v-checkbox>
                <v-range-slider 
                  v-model="$store.state.Performers.filters.hip" 
                  :disabled="!$store.state.Performers.filters.hipActive"
                  hide-details :min="20" :max="60"
                />
              </div>
            </v-col>
            <v-col cols="12" sm="4" class="py-0" v-if="showMoreFilters">
              <v-select
                v-model="$store.state.Performers.filters.ethnicity" 
                :items="$store.state.Settings.performerInfoEthnicity"
                label="Ethnicity" multiple hide-details outlined dense
                prepend-icon="mdi-account-group" append-icon=""
                @click:prepend-inner="changeFilterEthnicityLogic" 
                :prepend-inner-icon="filterEthnicityLogicIcon" 
                :menu-props="{contentClass:'select-dense-checkbox'}"
              />
            </v-col>
            <v-col cols="12" sm="4" class="py-0" v-if="showMoreFilters">
              <v-select
                v-model="$store.state.Performers.filters.hair"
                :items="$store.state.Settings.performerInfoHair"
                label="Hair" multiple hide-details outlined dense
                prepend-icon="mdi-face-woman" append-icon=""
                @click:prepend-inner="changeFilterHairLogic" 
                :prepend-inner-icon="filterHairLogicIcon" 
                :menu-props="{contentClass:'select-dense-checkbox'}"
              />
            </v-col>
            <v-col cols="12" sm="4" class="py-0" v-if="showMoreFilters">
              <v-select
                v-model="$store.state.Performers.filters.eyes"
                :items="$store.state.Settings.performerInfoEyes"
                label="Eyes" multiple hide-details outlined dense
                prepend-icon="mdi-eye" append-icon=""
                @click:prepend-inner="changeFilterEyesLogic" 
                :prepend-inner-icon="filterEyesLogicIcon" 
                :menu-props="{contentClass:'select-dense-checkbox'}"
              />
            </v-col>
            <v-col cols="12" sm="4" class="pb-0" v-if="showMoreFilters">
              <v-select
                v-model="$store.state.Performers.filters.cup"
                :items="$store.state.Settings.performerInfoCups"
                label="Cup" multiple hide-details outlined dense
                prepend-icon="mdi-coffee" append-icon=""
                :menu-props="{contentClass:'select-dense-checkbox'}"
              />
            </v-col>
            <v-col cols="12" sm="4" class="pb-0" v-if="showMoreFilters">
              <v-select
                v-model="$store.state.Performers.filters.boobs" 
                :items="boobsItems" label="Boobs" multiple hide-details outlined dense
                prepend-icon="mdi-vector-circle-variant" append-icon=""
                :menu-props="{contentClass:'select-dense-checkbox'}"
              />
            </v-col>
            <v-col cols="12" sm="4" class="pb-0" v-if="showMoreFilters">
              <v-select
                v-model="$store.state.Performers.filters.body" 
                :items="$store.state.Settings.performerInfoBody" 
                label="Body" multiple hide-details outlined dense
                prepend-icon="mdi-human-child" append-icon=""
                @click:prepend-inner="changeFilterBodyLogic" 
                :prepend-inner-icon="filterBodyLogicIcon" 
                :menu-props="{contentClass:'select-dense-checkbox'}"
              />
            </v-col>
            <v-col cols="12" sm="4" class="pb-0" v-if="showMoreFilters">
              <v-select
                v-model="$store.state.Performers.filters.pussy" 
                :items="$store.state.Settings.performerInfoPussy" 
                label="Pussy" multiple hide-details outlined dense
                prepend-icon="mdi-cat" append-icon=""
                :menu-props="{contentClass:'select-dense-checkbox'}"
              />
            </v-col>
            <v-col cols="12" sm="4" class="pb-0" v-if="showMoreFilters">
              <v-select
                v-model="$store.state.Performers.filters.pussyLips" 
                :items="$store.state.Settings.performerInfoPussyLips" 
                label="Pussy lips" multiple hide-details  outlined dense
                prepend-icon="mdi-cat" append-icon=""
                :menu-props="{contentClass:'select-dense-checkbox'}"
              />
            </v-col>
            <v-col cols="12" sm="4" class="pb-0" v-if="showMoreFilters">
              <v-select
                v-model="$store.state.Performers.filters.pussyHair" 
                :items="$store.state.Settings.performerInfoPussyHair" 
                label="Pussy hair" multiple hide-details outlined dense
                prepend-icon="mdi-cat" append-icon=""
                @click:prepend-inner="changeFilterPussyHairLogic" 
                :prepend-inner-icon="filterPussyHairLogicIcon"
                :menu-props="{contentClass:'select-dense-checkbox'}"
              />
            </v-col>
          </v-row>
        </v-container>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn small class="ma-4" color="primary" outlined @click="resetAllFiltersForPerformers(),filtersMenuForPerformers=false">
            <v-icon left>mdi-filter-off</v-icon> Reset all filters
          </v-btn>
          
          <v-btn small class="ma-4" color="primary" @click="addNewTabForPerformers(),filtersMenuForPerformers=false">
            <v-icon left>mdi-tab-plus</v-icon> Open result in new tab
          </v-btn>
          
          <v-btn small class="ma-4" color="primary" @click="applyAllFiltersForPerformers(),filtersMenuForPerformers=false">
            <v-icon left>mdi-filter</v-icon> Apply filters
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-menu>

    <v-tooltip v-if="$store.state.Tags.activeTab===1" bottom>
      <template v-slot:activator="{ on }">
        <v-btn @click="resetAllFiltersForPerformers" icon tile v-on="on"> 
            <v-icon>mdi-filter-off</v-icon>
        </v-btn>
      </template>
      <span>Reset all filters</span>
    </v-tooltip>
    
    <v-tooltip v-if="$store.state.Tags.activeTab===1" bottom>
      <template v-slot:activator="{ on }">
        <v-btn @click="toggleFavoritesForPerformers" icon tile v-on="on"> 
          <v-icon v-if="$store.state.Performers.filters.favorite">mdi-heart</v-icon>
          <v-icon v-else>mdi-heart-outline</v-icon>
        </v-btn>
      </template>
      <span v-if="$store.state.Performers.filters.favorite">Show all</span>
      <span v-else>Show favorites</span>
    </v-tooltip>

    <v-tooltip v-if="$store.state.Tags.activeTab===1" bottom>
      <template v-slot:activator="{ on }">
        <v-btn @click="toggleBookmarksForPerformers" icon tile v-on="on"> 
          <v-icon v-if="$store.state.Performers.filters.bookmark">mdi-bookmark</v-icon>
          <v-icon v-else>mdi-bookmark-outline</v-icon>
        </v-btn>
      </template>
      <span v-if="$store.state.Performers.filters.bookmark">Show all</span>
      <span v-else>Show bookmarks</span>
    </v-tooltip>

    
    <v-menu v-if="$store.state.Tags.activeTab===1"
      offset-y nudge-bottom="10" open-on-hover close-delay="1000" :close-on-content-click="false">
      <template v-slot:activator="{ on, attrs }">
        <v-btn v-bind="attrs"  v-on="on" icon tile>
          <v-icon>mdi-sort</v-icon>
        </v-btn>
      </template>
      <v-card>
        <v-btn-toggle v-model="sortButtonsForPerformers" mandatory class="group-buttons-sort" color="primary">
          <v-tooltip bottom>
            <template v-slot:activator="{ on }">
              <v-btn outlined @click="toggleSortDirectionForPerformers" value="name" v-on="on">
                <v-icon size="20">mdi-alphabetical-variant</v-icon>
                <v-icon right size="12" v-if="sortButtonsForPerformers==='name' && sortDirectionForPerformers==='desc'">
                  mdi-arrow-up-bold-outline
                </v-icon>
                <v-icon right size="12" v-if="sortButtonsForPerformers==='name' && sortDirectionForPerformers==='asc'">
                  mdi-arrow-down-bold-outline
                </v-icon>
              </v-btn>
            </template>
            <span>Sort by name</span>
          </v-tooltip>
          <v-tooltip bottom>
            <template v-slot:activator="{ on }">
              <v-btn outlined @click="toggleSortDirectionForPerformers" value="rating" v-on="on">
                <v-icon size="20">mdi-star-outline</v-icon>
                <v-icon right size="12" v-if="sortButtonsForPerformers==='rating' && sortDirectionForPerformers==='desc'">
                  mdi-arrow-down-bold-outline
                </v-icon>
                <v-icon right size="12" v-if="sortButtonsForPerformers==='rating' && sortDirectionForPerformers==='asc'">
                  mdi-arrow-up-bold-outline
                </v-icon>
              </v-btn>
            </template>
            <span>Sort by rating</span>
          </v-tooltip>
          <v-tooltip bottom>
            <template v-slot:activator="{ on }">
              <v-btn outlined @click="toggleSortDirectionForPerformers" value="date" v-on="on">
                <v-icon size="20">mdi-calendar-clock</v-icon>
                <v-icon right size="12" v-if="sortButtonsForPerformers==='date' && sortDirectionForPerformers==='desc'">
                  mdi-arrow-down-bold-outline
                </v-icon>
                <v-icon right size="12" v-if="sortButtonsForPerformers==='date' && sortDirectionForPerformers==='asc'">
                  mdi-arrow-up-bold-outline
                </v-icon>
              </v-btn>
            </template>
            <span>Sort by date added</span>
          </v-tooltip>
        </v-btn-toggle>
      </v-card>
    </v-menu>

    <v-tooltip v-if="$store.state.Tags.activeTab===1" bottom>
      <template v-slot:activator="{ on }">
        <v-btn icon tile @click="selectAllPerformers" v-on="on">
          <v-icon>mdi-select-all</v-icon>
        </v-btn>
      </template>
      <span>Select all performers</span>
    </v-tooltip>

    <v-spacer></v-spacer>

    <v-menu v-if="$store.state.Tags.activeTab===0"
      offset-y nudge-bottom="10" open-on-hover close-delay="1000" :close-on-content-click="false">
      <template v-slot:activator="{ on, attrs }">
        <v-btn v-bind="attrs"  v-on="on" icon tile>
          <v-icon>mdi-magnify</v-icon>
          <v-icon class="card-size-icon">mdi-size-{{getCardSizeIconForVideos()}}</v-icon>
        </v-btn>
      </template>
      <v-card width="300">
        <v-card-title class="py-1">
          <span class="headline">Card size</span>
          <v-spacer></v-spacer>
          <v-icon>mdi-card-bulleted-settings</v-icon>
        </v-card-title>
        <v-divider></v-divider>
        <v-slider v-model="$store.state.Settings.videoCardSize"
          min="1" max="5" step="1" :tick-labels="cardSizes"
          @input="changeCardSizeForVideos" class="pa-6"
        />
      </v-card>
    </v-menu>

    <v-tooltip v-if="$store.state.Tags.activeTab===0" bottom>
      <template v-slot:activator="{ on }">
        <v-btn icon tile @click="toggleChipsColoredForVideos()" v-on="on">
          <v-icon v-if="isChipsColoredForVideos" color="white" class="colored">
            mdi-label-variant
          </v-icon>
          <v-icon v-else>mdi-label-variant</v-icon>
        </v-btn>
      </template>
      <span v-if="isChipsColoredForVideos">Make labels grey</span>
      <span v-else>Make labels colored</span>
    </v-tooltip>

    <v-tooltip bottom>
      <template v-slot:activator="{ on }">
        <v-badge :value="isEditBtnHiddenForVideos" icon="mdi-eye-off" overlap offset-x="25" offset-y="25">
          <v-btn icon tile @click="toggleEditBtnVisibiltyForVideos()" v-on="on">
            <v-icon>mdi-movie-edit</v-icon>
          </v-btn>
        </v-badge>
      </template>
      <span v-if="isEditBtnHiddenForVideos">Show edit button</span>
      <span v-else>Hide edit button</span>
    </v-tooltip>

    <v-tooltip v-if="$store.state.Tags.activeTab===0" bottom>
      <template v-slot:activator="{ on }">
        <v-badge :value="isQualityLabelHidden" icon="mdi-eye-off" overlap offset-x="25" offset-y="25">
          <v-btn icon tile @click="toggleQualityLabelVisibilty()" v-on="on">
            <v-icon>mdi-video-box</v-icon>
          </v-btn>
        </v-badge>
      </template>
      <span v-if="isQualityLabelHidden">Show Quality Label</span>
      <span v-else>Hide Quality Label</span>
    </v-tooltip>

    <v-tooltip v-if="$store.state.Tags.activeTab===0" bottom>
      <template v-slot:activator="{ on }">
        <v-badge :value="isDurationHidden" icon="mdi-eye-off" overlap offset-x="25" offset-y="25">
          <v-btn icon tile @click="toggleDurationVisibilty()" v-on="on">
            <v-icon>mdi-timer</v-icon>
          </v-btn>
        </v-badge>
      </template>
      <span v-if="isDurationHidden">Show Duration</span>
      <span v-else>Hide Duration</span>
    </v-tooltip>

    <v-tooltip v-if="$store.state.Tags.activeTab===0" bottom>
      <template v-slot:activator="{ on }">
        <v-badge :value="isRatingHiddenForVideos" icon="mdi-eye-off" overlap offset-x="25" offset-y="25">
          <v-btn icon tile @click="toggleRatingVisibiltyForVideos()" v-on="on">
            <v-icon>mdi-star</v-icon>
          </v-btn>
        </v-badge>
      </template>
      <span v-if="isRatingHiddenForVideos">Show Rating</span>
      <span v-else>Hide Rating</span>
    </v-tooltip>

    <v-tooltip v-if="$store.state.Tags.activeTab===0" bottom>
      <template v-slot:activator="{ on }">
        <v-badge :value="isFavoriteHiddenForVideos" icon="mdi-eye-off" overlap offset-x="25" offset-y="25">
          <v-btn icon tile @click="toggleFavoriteVisibiltyForVideos()" v-on="on">
            <v-icon>mdi-heart</v-icon>
          </v-btn>
        </v-badge>
      </template>
      <span v-if="isFavoriteHiddenForVideos">Show Favorite heart</span>
      <span v-else>Hide Favorite heart</span>
    </v-tooltip>

    <v-tooltip v-if="$store.state.Tags.activeTab===0" bottom>
      <template v-slot:activator="{ on }">
        <v-badge :value="isFileNameHidden" icon="mdi-eye-off" overlap offset-x="25" offset-y="25">
          <v-btn icon tile @click="toggleFileNameVisibilty()" v-on="on">
            <v-icon>mdi-alphabetical-variant</v-icon>
          </v-btn>
        </v-badge>
      </template>
      <span v-if="isFileNameHidden">Show Filename</span>
      <span v-else>Hide Filename</span>
    </v-tooltip>
    
    <v-tooltip v-if="$store.state.Tags.activeTab===0" bottom>
      <template v-slot:activator="{ on }">
        <v-badge :value="isFileInfoHidden" icon="mdi-eye-off" overlap offset-x="25" offset-y="25">
          <v-btn icon tile @click="toggleFileInfoVisibilty()" v-on="on">
            <v-icon>mdi-filmstrip</v-icon>
          </v-btn>
        </v-badge>
      </template>
      <span v-if="isFileInfoHidden">Show File Information</span>
      <span v-else>Hide File Information</span>
    </v-tooltip>

    <v-tooltip v-if="$store.state.Tags.activeTab===0" bottom>
      <template v-slot:activator="{ on }">
        <v-badge :value="isPerformersHidden" icon="mdi-eye-off" overlap offset-x="25" offset-y="25">
          <v-btn icon tile @click="togglePerformerVisibilty()" v-on="on">
            <v-icon>mdi-account</v-icon>
          </v-btn>
        </v-badge>
      </template>
      <span v-if="isPerformersHidden">Show Performers</span>
      <span v-else>Hide Performers</span>
    </v-tooltip>
    
    <v-tooltip v-if="$store.state.Tags.activeTab===0" bottom>
      <template v-slot:activator="{ on }">
        <v-badge :value="isTagsHiddenForVideos" icon="mdi-eye-off" overlap offset-x="25" offset-y="25">
          <v-btn icon tile @click="toggleTagsVisibiltyForVideos()" v-on="on">
            <v-icon>mdi-tag</v-icon>
          </v-btn>
        </v-badge>
      </template>
      <span v-if="isTagsHiddenForVideos">Show Tags</span>
      <span v-else>Hide Tags</span>
    </v-tooltip>
    
    <v-tooltip v-if="$store.state.Tags.activeTab===0" bottom>
      <template v-slot:activator="{ on }">
        <v-badge :value="isWebsiteHidden" icon="mdi-eye-off" overlap offset-x="25" offset-y="25">
          <v-btn icon tile @click="toggleWebsiteVisibilty()" v-on="on">
            <v-icon>mdi-web</v-icon>
          </v-btn>
        </v-badge>
      </template>
      <span v-if="isWebsiteHidden">Show Website</span>
      <span v-else>Hide Website</span>
    </v-tooltip>
    
    <v-menu v-if="$store.state.Tags.activeTab===1"
      offset-y nudge-bottom="10" open-on-hover close-delay="1000" :close-on-content-click="false">
      <template v-slot:activator="{ on, attrs }">
        <v-btn v-bind="attrs"  v-on="on" icon tile>
          <v-icon>mdi-magnify</v-icon>
          <v-icon class="card-size-icon">mdi-size-{{getCardSizeIcon()}}</v-icon>
        </v-btn>
      </template>
      <v-card width="300">
        <v-card-title class="py-1">
          <span class="headline">Card size</span>
          <v-spacer></v-spacer>
          <v-icon>mdi-card-bulleted-settings</v-icon>
        </v-card-title>
        <v-divider></v-divider>
        <v-slider v-model="$store.state.Settings.performerCardSize"
          min="1" max="5" step="1" :tick-labels="cardSizes"
          @input="changeCardSizeForPerformers" class="pa-6"
        />
      </v-card>
    </v-menu>

    <v-tooltip v-if="$store.state.Tags.activeTab===1" bottom>
      <template v-slot:activator="{ on }">
        <v-btn icon tile @click="toggleChipsColoredForPerformers()" v-on="on">
          <v-icon v-if="isChipsColoredForPerformers" color="white" class="colored">
            mdi-label-variant
          </v-icon>
          <v-icon v-else>mdi-label-variant</v-icon>
        </v-btn>
      </template>
      <span v-if="isChipsColoredForPerformers">Make labels grey</span>
      <span v-else>Make labels colored</span>
    </v-tooltip>

    <v-tooltip bottom>
      <template v-slot:activator="{ on }">
        <v-badge :value="isEditBtnHiddenForPerformers" icon="mdi-eye-off" overlap offset-x="25" offset-y="25">
          <v-btn icon tile @click="toggleEditBtnVisibiltyForPerformers()" v-on="on">
            <v-icon>mdi-account-edit</v-icon>
          </v-btn>
        </v-badge>
      </template>
      <span v-if="isEditBtnHiddenForPerformers">Show edit button</span>
      <span v-else>Hide edit button</span>
    </v-tooltip>

    <v-tooltip v-if="$store.state.Tags.activeTab===1" bottom>
      <template v-slot:activator="{ on }">
        <v-badge :value="isRatingHiddenForPerformers" icon="mdi-eye-off" overlap offset-x="25" offset-y="25">
          <v-btn icon tile @click="toggleRatingVisibiltyForPerformers()" v-on="on">
            <v-icon>mdi-star</v-icon>
          </v-btn>
        </v-badge>
      </template>
      <span v-if="isRatingHiddenForPerformers">Show Rating</span>
      <span v-else>Hide Rating</span>
    </v-tooltip>

    <v-tooltip v-if="$store.state.Tags.activeTab===1" bottom>
      <template v-slot:activator="{ on }">
        <v-badge :value="isNationalityHidden" icon="mdi-eye-off" overlap offset-x="25" offset-y="25">
          <v-btn icon tile @click="toggleNationalityVisibilty()" v-on="on">
            <v-icon>mdi-flag</v-icon>
          </v-btn>
        </v-badge>
      </template>
      <span v-if="isNationalityHidden">Show country flag</span>
      <span v-else>Hide country flag</span>
    </v-tooltip>

    <v-tooltip v-if="$store.state.Tags.activeTab===1" bottom>
      <template v-slot:activator="{ on }">
        <v-badge :value="isFavoriteHiddenForPerformers" icon="mdi-eye-off" overlap offset-x="25" offset-y="25">
          <v-btn icon tile @click="toggleFavoriteVisibiltyForPerformers()" v-on="on">
            <v-icon>mdi-heart</v-icon>
          </v-btn>
        </v-badge>
      </template>
      <span v-if="isFavoriteHiddenForPerformers">Show Favorite's heart</span>
      <span v-else>Hide Favorite's heart</span>
    </v-tooltip>

    <v-tooltip v-if="$store.state.Tags.activeTab===1" bottom>
      <template v-slot:activator="{ on }">
        <v-badge :value="isNameHiddenForPerformers" icon="mdi-eye-off" overlap offset-x="25" offset-y="25">
          <v-btn icon tile @click="toggleNameVisibilty()" v-on="on">
            <v-icon>mdi-alphabetical-variant</v-icon>
          </v-btn>
        </v-badge>
      </template>
      <span v-if="isNameHiddenForPerformers">Show Name</span>
      <span v-else>Hide Name</span>
    </v-tooltip>
    
    <v-tooltip v-if="$store.state.Tags.activeTab===1" bottom>
      <template v-slot:activator="{ on }">
        <v-badge :value="isAliasesHidden" icon="mdi-eye-off" overlap offset-x="25" offset-y="25">
          <v-btn icon tile @click="toggleAliasesVisibiltyForPerformers()" v-on="on">
            <v-icon>mdi-alphabetical</v-icon>
          </v-btn>
        </v-badge>
      </template>
      <span v-if="isAliasesHidden">Show Aliases</span>
      <span v-else>Hide Aliases</span>
    </v-tooltip>

    <v-tooltip v-if="$store.state.Tags.activeTab===1" bottom>
      <template v-slot:activator="{ on }">
        <v-badge :value="isMeterHidden" icon="mdi-eye-off" overlap offset-x="25" offset-y="25">
          <v-btn icon tile @click="toggleMeterVisibilty()" v-on="on">
            <v-icon>mdi-gauge</v-icon>
          </v-btn>
        </v-badge>
      </template>
      <span v-if="isMeterHidden">Show Tags Meter</span>
      <span v-else>Hide Tags Meter</span>
    </v-tooltip>

    <v-tooltip v-if="$store.state.Tags.activeTab===1" bottom>
      <template v-slot:activator="{ on }">
        <v-badge :value="isCareerStatusHidden" icon="mdi-eye-off" overlap offset-x="25" offset-y="25">
          <v-btn icon tile @click="toggleCareerStatusVisibilty()" v-on="on">
            <v-icon>mdi-list-status</v-icon>
          </v-btn>
        </v-badge>
      </template>
      <span v-if="isCareerStatusHidden">Show Career Status</span>
      <span v-else>Hide Career Status</span>
    </v-tooltip>

    <v-tooltip v-if="$store.state.Tags.activeTab===1" bottom>
      <template v-slot:activator="{ on }">
        <v-badge :value="isTagsHiddenForPerformers" icon="mdi-eye-off" overlap offset-x="25" offset-y="25">
          <v-btn icon tile @click="toggleTagsVisibiltyForPerformers()" v-on="on">
            <v-icon>mdi-tag</v-icon>
          </v-btn>
        </v-badge>
      </template>
      <span v-if="isTagsHiddenForPerformers">Show Tags</span>
      <span v-else>Hide Tags</span>
    </v-tooltip>

    <v-tooltip v-if="$store.state.Tags.activeTab===1" bottom>
      <template v-slot:activator="{ on }">
        <v-badge :value="isVideoTagsHidden" icon="mdi-eye-off" overlap offset-x="25" offset-y="25">
          <v-btn icon tile @click="toggleVideoTagsVisibilty()" v-on="on">
            <v-icon>mdi-tag-outline</v-icon>
          </v-btn>
        </v-badge>
      </template>
      <span v-if="isVideoTagsHidden">Show Video Tags</span>
      <span v-else>Hide Video Tags</span>
    </v-tooltip>

    <template v-slot:extension v-if="$store.getters.tabs.length">
      <Tabs />
    </template>
	</v-app-bar>
</template>


<script>
const shortid = require("shortid")

import FilterVideos from '@/mixins/FilterVideos'
import FilterPerformers from '@/mixins/FilterPerformers'
import ShowImageFunction from '@/mixins/ShowImageFunction'

export default {
  name: 'PerformerAppbar',
  components: {
    Tabs: () => import('@/components/elements/Tabs.vue'),
  },
  mixins: [FilterVideos, FilterPerformers, ShowImageFunction], 
  mounted() {
    this.$nextTick(function () {
    })
  },
  data: () => ({
    filtersMenuForVideos: false,
    filtersMenuForPerformers: false,
    showMoreFilters: false,
    filterPerformersLogicIcon: 'mdi-math-norm',
    filterTagsLogicForVideosIcon: 'mdi-math-norm',
    filterCategoryLogicIcon: 'mdi-math-norm',
    filterTagsLogicForPerformersIcon: 'mdi-math-norm',
    filterEthnicityLogicIcon: 'mdi-math-norm',
    filterHairLogicIcon: 'mdi-math-norm',
    filterEyesLogicIcon: 'mdi-math-norm',
    filterBodyLogicIcon: 'mdi-math-norm',
    filterPussyHairLogicIcon: 'mdi-math-norm',
    cardSizes: ['XS','S','M','L','XL'],
  }),
  computed: {
    tag() {
      return this.$store.getters.tags.find({ id: this.tagId }).value()    
    },
    tagId() {
      return this.$route.params.id.replace(/:/g, '')    
    },
    colorHeader() {
      if (this.$vuetify.theme.isDark) {
        return this.$store.state.Settings.appColorDarkHeader
      } else return this.$store.state.Settings.appColorLightHeader
    },
    filterBadgeVideos() {
      let total = this.$store.getters.filteredVideosTotal
      return total !== this.$store.getters.videosTotal
    },
    filteredVideosTotal() {
      return this.$store.getters.filteredVideosTotal
    },
    sortButtonsForVideos: {
      get() {
        return this.$store.state.Videos.filters.sortBy
      },
      set(value) {
        this.updateFiltersOfVideos('sortBy', value)
      },
    },
    sortDirectionForVideos() {
      return this.$store.state.Videos.filters.sortDirection
    },
    isChipsColoredForVideos: {
      get() {
        return this.$store.state.Videos.videoChipsColored
      },
      set(value) {
        this.$store.dispatch('updateVideoChipsColored', value)
      },
    },
    isEditBtnHiddenForVideos: {
      get() {
        return this.$store.state.Videos.videoEditBtnHidden
      },
      set(value) {
        this.$store.dispatch('updateVideoEditBtnHidden', value)
      },
    },
    isFileNameHidden: {
      get() {
        return this.$store.state.Videos.videoFileNameHidden
      },
      set(value) {
        this.$store.dispatch('updateVideoFileNameHidden', value)
      },
    },
    isFileInfoHidden: {
      get() {
        return this.$store.state.Videos.videoFileInfoHidden
      },
      set(value) {
        this.$store.dispatch('updateVideoFileInfoHidden', value)
      },
    },
    isRatingHiddenForVideos: {
      get() {
        return this.$store.state.Videos.videoRatingHidden
      },
      set(value) {
        this.$store.dispatch('updateVideoRatingHidden', value)
      },
    },
    isFavoriteHiddenForVideos: {
      get() {
        return this.$store.state.Videos.videoFavoriteHidden
      },
      set(value) {
        this.$store.dispatch('updateVideoFavoriteHidden', value)
      },
    },
    isQualityLabelHidden: {
      get() {
        return this.$store.state.Videos.videoQualityLabelHidden
      },
      set(value) {
        this.$store.dispatch('updateVideoQualityLabelHidden', value)
      },
    },
    isDurationHidden: {
      get() {
        return this.$store.state.Videos.videoDurationHidden
      },
      set(value) {
        this.$store.dispatch('updateVideoDurationHidden', value)
      },
    },
    isPerformersHidden: {
      get() {
        return this.$store.state.Videos.videoPerformersHidden
      },
      set(value) {
        this.$store.dispatch('updateVideoPerformersHidden', value)
      },
    },
    isTagsHiddenForVideos: {
      get() {
        return this.$store.state.Videos.videoTagsHidden
      },
      set(value) {
        this.$store.dispatch('updateVideoTagsHidden', value)
      },
    },
    isWebsiteHidden: {
      get() {
        return this.$store.state.Videos.videoWebsiteHidden
      },
      set(value) {
        this.$store.dispatch('updateVideoWebsiteHidden', value)
      },
    },
    filterBadgeForPerformers() {
      let total = this.$store.getters.filteredPerformersTotal
      return total !== this.$store.getters.performersTotal
    },
    filteredPerformersTotal() {
      return this.$store.getters.filteredPerformersTotal
    },
    sortButtonsForPerformers: {
      get() {
        return this.$store.state.Performers.filters.sortBy
      },
      set(value) {
        this.updateFiltersOfPerformers('sortBy', value)
      },
    },
    sortDirectionForPerformers() {
      return this.$store.state.Performers.filters.sortDirection
    },
    isChipsColoredForPerformers: {
      get() {
        return this.$store.state.Performers.performerChipsColored
      },
      set(value) {
        this.$store.dispatch('updatePerformerChipsColored', value)
      },
    },
    isEditBtnHiddenForPerformers: {
      get() {
        return this.$store.state.Performers.performerEditBtnHidden
      },
      set(value) {
        this.$store.dispatch('updatePerformerEditBtnHidden', value)
      },
    },
    isRatingHiddenForPerformers: {
      get () {
        return this.$store.state.Performers.performerRatingHidden
      },
      set (value) {
        this.$store.dispatch('updatePerformerRatingHidden', value)
      },
    },
    isNationalityHidden: {
      get () {
        return this.$store.state.Performers.performerNationalityHidden
      },
      set (value) {
        this.$store.dispatch('updatePerformerNationalityHidden', value)
      },
    },
    isFavoriteHiddenForPerformers: {
      get () {
        return this.$store.state.Performers.performerFavoriteHidden
      },
      set (value) {
        this.$store.dispatch('updatePerformerFavoriteHidden', value)
      },
    },
    isNameHiddenForPerformers: {
      get () {
        return this.$store.state.Performers.performerNameHidden
      },
      set (value) {
        this.$store.dispatch('updatePerformerNameHidden', value)
      },
    },
    isAliasesHidden: {
      get () {
        return this.$store.state.Performers.performerAliasesHidden
      },
      set (value) {
        this.$store.dispatch('updatePerformerAliasesHidden', value)
      },
    },
    isMeterHidden: {
      get () {
        return this.$store.state.Performers.performerMeterHidden
      },
      set (value) {
        this.$store.dispatch('updatePerformerMeterHidden', value)
      },
    },
    isCareerStatusHidden: {
      get () {
        return this.$store.state.Performers.performerCareerStatusHidden
      },
      set (value) {
        this.$store.dispatch('updatePerformerCareerStatusHidden', value)
      },
    },
    isTagsHiddenForPerformers: {
      get () {
        return this.$store.state.Performers.performerTagsHidden
      },
      set (value) {
        this.$store.dispatch('updatePerformerTagsHidden', value)
      },
    },
    isVideoTagsHidden: {
      get () {
        return this.$store.state.Performers.performerVideoTagsHidden
      },
      set (value) {
        this.$store.dispatch('updatePerformerVideoTagsHidden', value)
      },
    },
    tabId() {
      return this.$route.query.tabId
    },
  },
  methods: {
    filterItemsPerformers(item, queryText, itemText) {
      const searchText = queryText.toLowerCase()
      const aliases = item.aliases
      let found = false
      for (let i=0;i<aliases.length;i++) {
        if (aliases[i].toLowerCase().indexOf(searchText) > -1) found = true
      }
      if (item.name.toLowerCase().indexOf(searchText) > -1) found = true
      return found
    },
    filterItemsTagsForVideos(item, queryText, itemText) {
      const searchText = queryText.toLowerCase()
      const alternateNames = item.altNames
      let found = false
      for (let i=0;i<alternateNames.length;i++) {
        if (alternateNames[i].toLowerCase().indexOf(searchText) > -1) found = true
      }
      if (item.name.toLowerCase().indexOf(searchText) > -1) found = true
      return found
    },
    changeFilterPerformersLogic() {
      let logic = this.$store.state.Videos.filters.performersLogic
      this.filterPerformersLogicIcon = logic ? 'mdi-math-norm' : 'mdi-ampersand' 
      this.updateFiltersOfVideos('performersLogic', !logic)
    },
    changeFilterTagsLogicForVideos() {
      let logic = this.$store.state.Videos.filters.tagsLogic
      this.filterTagsLogicForVideosIcon = logic ? 'mdi-math-norm' : 'mdi-ampersand' 
      this.updateFiltersOfVideos('tagsLogic', !logic)
    },
    addNewTabForVideos() {
      let tabId = shortid.generate()
      let tab = { 
        name: this.$store.getters.videosFilters, 
        link: `/videos/:${tabId}?tabId=${tabId}`,
        id: tabId,
        filters: _.cloneDeep(this.$store.state.Videos.filters),
        icon: 'video-outline'
      }
      this.$store.dispatch('addNewTab', tab)
    },
    removePerformer(item) { 
      const index = this.$store.state.Videos.filters.performers.indexOf(item.name)
      if (index >= 0) this.$store.state.Videos.filters.performers.splice(index, 1)
      this.$store.state.hoveredImage = false
    },
    removeTagForVideos(item) { 
      const index = this.$store.state.Videos.filters.tags.indexOf(item.name)
      if (index >= 0) this.$store.state.Videos.filters.tags.splice(index, 1)
      this.$store.state.hoveredImage = false
    },
    removeWebsite(item) { 
      const index = this.$store.state.Videos.filters.websites.indexOf(item.name)
      if (index >= 0) this.$store.state.Videos.filters.websites.splice(index, 1)
      this.$store.state.hoveredImage = false
    },
    resetAllFiltersForVideos(event) {
      this.$store.commit('resetFilteredVideos')
      this.updateFiltersOfVideos('tags', [this.tag.name])
      this.$store.dispatch('filterVideos')
    },
    applyAllFiltersForVideos() {
      this.$store.dispatch('filterVideos')
      this.updateTabFiltersOfVideos()
    },
    updateTabFiltersOfVideos() {
      if (this.tabId !== 'default') {
        let newFilters = _.cloneDeep(this.$store.state.Videos.filters)
        this.$store.getters.tabsDb.find({id: this.tabId}).get('filters').assign({videos: newFilters}).write()
      }
    },
    updateFiltersOfVideos(key, value){
      this.$store.commit('updateFiltersOfVideos', {key, value})
      this.updateTabFiltersOfVideos()
    },
    toggleFavoritesForVideos() {
      this.updateFiltersOfVideos('favorite', !this.$store.state.Videos.filters.favorite)
      this.$store.dispatch('filterVideos')
    },
    toggleBookmarksForVideos() {
      this.updateFiltersOfVideos('bookmark', !this.$store.state.Videos.filters.bookmark)
      this.$store.dispatch('filterVideos')
    },
    toggleSortDirectionForVideos() {
      let dir = this.sortDirectionForVideos === 'asc' ? 'desc' : 'asc'
      this.updateFiltersOfVideos('sortDirection', dir)
      setTimeout(()=>{
        this.$store.dispatch('filterVideos')
      },200)
    },
    selectAllVideos() {
      this.$store.state.Videos.selection.clearSelection()
      let selected = this.$store.state.Videos.selection.select('.video-card')
      this.$store.state.Videos.selection.keepSelection()
      this.getSelectedVideos(selected)
      for (let i=0;i<selected.length;++i) {
        selected[i].classList.add("selected")
      }
    },
    getSelectedVideos(selectedVideos){
      let ids = selectedVideos.map(item => (item.dataset.id))
      this.$store.commit('updateSelectedVideos', ids)
    },
    toggleChipsColoredForVideos() {
      this.isChipsColoredForVideos = !this.isChipsColoredForVideos
    },
    toggleEditBtnVisibiltyForVideos() {
      this.isEditBtnHiddenForVideos = !this.isEditBtnHiddenForVideos
    },
    toggleFileNameVisibilty() {
      this.isFileNameHidden = !this.isFileNameHidden
    },
    toggleQualityLabelVisibilty() {
      this.isQualityLabelHidden = !this.isQualityLabelHidden
    },
    toggleDurationVisibilty() {
      this.isDurationHidden = !this.isDurationHidden
    },
    toggleRatingVisibiltyForVideos() {
      this.isRatingHiddenForVideos = !this.isRatingHiddenForVideos
    },
    toggleFavoriteVisibiltyForVideos() {
      this.isFavoriteHiddenForVideos = !this.isFavoriteHiddenForVideos
    },
    toggleFileInfoVisibilty() {
      this.isFileInfoHidden = !this.isFileInfoHidden
    },
    togglePerformerVisibilty() {
      this.isPerformersHidden = !this.isPerformersHidden
    },
    toggleTagsVisibiltyForVideos() {
      this.isTagsHiddenForVideos = !this.isTagsHiddenForVideos
    },
    toggleWebsiteVisibilty() {
      this.isWebsiteHidden = !this.isWebsiteHidden
    },
    changeCardSizeForVideos(event) {
      this.getCardSizeIconForVideos()
      this.$store.getters.settings.set('videoCardSize', event).write()
    },
    getCardSizeIconForVideos() {
      let size = ''
      switch(this.$store.state.Settings.videoCardSize) {
        case 1: size = 'xs'; break;
        case 2: size = 's'; break;
        case 3: size = 'm'; break;
        case 4: size = 'l'; break;
        case 5: size = 'xl'; break;
      }
      return size
    },
    filterItemsTagsForPerformers(item, queryText, itemText) {
      const searchText = queryText.toLowerCase()
      const alternateNames = item.altNames
      let found = false
      for (let i=0;i<alternateNames.length;i++) {
        if (alternateNames[i].toLowerCase().indexOf(searchText) > -1) found = true
      }
      if (item.name.toLowerCase().indexOf(searchText) > -1) found = true
      return found
    },
    changeFilterTagsLogicForPerformers() {
      let logic = this.$store.state.Performers.filters.tagsLogic
      this.filterTagsLogicForPerformersIcon = logic ? 'mdi-math-norm' : 'mdi-ampersand' 
      this.updateFiltersOfPerformers('tagsLogic', !logic)
    },
    changeFilterCategoryLogic() {
      let logic = this.$store.state.Performers.filters.categoryLogic
      this.filterCategoryLogicIcon = logic ? 'mdi-math-norm' : 'mdi-ampersand' 
      this.updateFiltersOfPerformers('categoryLogic', !logic)
    },
    changeFilterEthnicityLogic() {
      let logic = this.$store.state.Performers.filters.ethnicityLogic
      this.filterEthnicityLogicIcon = logic ? 'mdi-math-norm' : 'mdi-ampersand'
      this.updateFiltersOfPerformers('ethnicityLogic', !logic)
    },
    changeFilterHairLogic() {
      let logic = this.$store.state.Performers.filters.hairLogic
      this.filterHairLogicIcon = logic ? 'mdi-math-norm' : 'mdi-ampersand'
      this.updateFiltersOfPerformers('hairLogic', !logic)
    },
    changeFilterEyesLogic() {
      let logic = this.$store.state.Performers.filters.eyesLogic
      this.filterEyesLogicIcon = logic ? 'mdi-math-norm' : 'mdi-ampersand'
      this.updateFiltersOfPerformers('eyesLogic', !logic)
    },
    changeFilterBodyLogic() {
      let logic = this.$store.state.Performers.filters.bodyLogic
      this.filterBodyLogicIcon = logic ? 'mdi-math-norm' : 'mdi-ampersand'
      this.updateFiltersOfPerformers('bodyLogic', !logic)
    },
    changeFilterPussyHairLogic() {
      let logic = this.$store.state.Performers.filters.pussyHairLogic
      this.filterPussyHairLogicIcon = logic ? 'mdi-math-norm' : 'mdi-ampersand'
      this.updateFiltersOfPerformers('pussyHairLogic', !logic)
    },
    addNewTabForPerformers() {
      let tabId = shortid.generate()
      let tab = { 
        name: this.$store.getters.performersFilters, 
        link: `/performers/:${tabId}?tabId=${tabId}`,
        id: tabId,
        filters: _.cloneDeep(this.$store.state.Performers.filters),
        icon: 'account-outline'
      }
      this.$store.dispatch('addNewTab', tab)
    },
    removeTagForPerformers(item) { 
      const index = this.$store.state.Performers.filters.tags.indexOf(item.name)
      if (index >= 0) this.$store.state.Performers.filters.tags.splice(index, 1)
      this.$store.state.hoveredImage = false
    },
    removeCountry(item) { 
      const index = this.$store.state.Performers.filters.nation.indexOf(item.name)
      if (index >= 0) this.$store.state.Performers.filters.nation.splice(index, 1)
      this.$store.state.hoveredImage = false
    },
    resetAllFiltersForPerformers(event) {
      this.$store.commit('resetFilteredPerformers')
      this.updateFiltersOfPerformers('tags', [this.tag.name])
      this.$store.dispatch('filterPerformers')
    },
    applyAllFiltersForPerformers() {
      this.$store.dispatch('filterPerformers')
      this.updateTabFiltersOfPerformers()
    },
    toggleFavoritesForPerformers() {
      this.updateFiltersOfPerformers('favorite', !this.$store.state.Performers.filters.favorite)
      this.$store.dispatch('filterPerformers')
    },
    toggleBookmarksForPerformers() {
      updateFiltersOfPerformers('bookmark', !this.$store.state.Performers.filters.bookmark)
      this.$store.dispatch('filterPerformers')
    },
    updateTabFiltersOfPerformers() {
      if (this.tabId !== 'default') {
        let newFilters = _.cloneDeep(this.$store.state.Performers.filters)
        this.$store.getters.tabsDb.find({id: this.tabId}).get('filters').assign({performers: newFilters}).write()
      }
    },
    updateFiltersOfPerformers(key, value){
      this.$store.commit('updateFiltersOfPerformers', {key, value})
      this.updateTabFiltersOfPerformers()
    },
    toggleSortDirectionForPerformers() {
      let dir = this.sortDirectionForPerformers === 'asc' ? 'desc' : 'asc'
      this.updateFiltersOfPerformers('sortDirection', dir)
      setTimeout(()=>{
        this.$store.dispatch('filterPerformers')
      },200)
    },
    selectAllPerformers() {
      this.$store.state.Performers.selection.clearSelection()
      let selected = this.$store.state.Performers.selection.select('.performer-card')
      this.$store.state.Performers.selection.keepSelection()
      this.getSelectedPerformers(selected)
      for (let i=0;i<selected.length;++i) {
        selected[i].classList.add("selected")
      }
    },
    getSelectedPerformers(selectedPerformers){
      let ids = selectedPerformers.map(item => (item.dataset.id))
      this.$store.commit('updateSelectedPerformers', ids)
    },
    toggleChipsColoredForPerformers() {
      this.isChipsColoredForPerformers = !this.isChipsColoredForPerformers
    },
    toggleEditBtnVisibiltyForPerformers() {
      this.isEditBtnHiddenForPerformers = !this.isEditBtnHiddenForPerformers
    },
    toggleMeterVisibilty() {
      this.isMeterHidden = !this.isMeterHidden
    },
    toggleNameVisibilty() {
      this.isNameHiddenForPerformers = !this.isNameHiddenForPerformers
    },
    toggleRatingVisibiltyForPerformers() {
      this.isRatingHiddenForPerformers = !this.isRatingHiddenForPerformers
    },
    toggleNationalityVisibilty() {
      this.isNationalityHidden = !this.isNationalityHidden
    },
    toggleFavoriteVisibiltyForPerformers() {
      this.isFavoriteHiddenForPerformers = !this.isFavoriteHiddenForPerformers
    },
    toggleAliasesVisibiltyForPerformers() {
      this.isAliasesHidden = !this.isAliasesHidden
    },
    toggleCareerStatusVisibilty() {
      this.isCareerStatusHidden = !this.isCareerStatusHidden
    },
    toggleTagsVisibiltyForPerformers() {
      this.isTagsHiddenForPerformers = !this.isTagsHiddenForPerformers
    },
    toggleVideoTagsVisibilty() {
      this.isVideoTagsHidden = !this.isVideoTagsHidden
    },
    changeCardSizeForPerformers(event) {
      this.getCardSizeIcon()
      this.$store.getters.settings.set('performerCardSize', event).write()
    },
    getCardSizeIcon() {
      let size = ''
      switch(this.$store.state.Settings.performerCardSize) {
        case 1: size = 'xs'; break;
        case 2: size = 's'; break;
        case 3: size = 'm'; break;
        case 4: size = 'l'; break;
        case 5: size = 'xl'; break;
      }
      return size
    },
  },
  watch: {
  },
}
</script>


<style lang="less" scoped>
.colored {
  border-radius: 3px;
  background: conic-gradient(red, yellow, lime, aqua, blue, magenta, red)
}
</style>